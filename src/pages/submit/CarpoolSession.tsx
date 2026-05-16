import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Users, QrCode, AlertTriangle, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import StarRating from '@/components/StarRating';

// ── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── ENB Reward formula (canonical — matches Carpool_Spec_v2_Final) ───────────
const BASE_RATE: Record<string, number> = {
  'Bike': 100, 'Rickshaw': 120, 'Auto-rickshaw': 120,
  'Car': 150, 'Van/Minivan': 200, 'Bus/Coaster': 300,
};
const ENB_CAP: Record<string, number> = {
  'Bike': 3000, 'Rickshaw': 4000, 'Auto-rickshaw': 4000,
  'Car': 5000, 'Van/Minivan': 10000, 'Bus/Coaster': 20000,
};
const PASSENGER_MULT = [0, 1.0, 1.3, 1.6, 2.0, 2.5];
const SPEED_MAX: Record<string, number> = {
  'Bike': 70, 'Rickshaw': 40, 'Auto-rickshaw': 50,
  'Car': 100, 'Van/Minivan': 80, 'Bus/Coaster': 80,
};
const SPEED_MIN = 3;

export function calcRideEnb(
  vehicleType: string, distanceKm: number,
  passengers: number, ratingMult = 1.0, confirmationBonus = 0
): number {
  const base = BASE_RATE[vehicleType] || 150;
  const pMult = PASSENGER_MULT[Math.min(passengers, 5)] || 2.5;
  const cap = ENB_CAP[vehicleType] || 5000;
  const raw = (base * distanceKm * pMult * ratingMult) + confirmationBonus;
  return Math.min(Math.round(raw), cap);
}

export function calcSpeedFlag(vehicleType: string, distanceKm: number, durationMin: number): boolean {
  if (durationMin <= 0) return false;
  const speedKmh = (distanceKm / durationMin) * 60;
  const max = SPEED_MAX[vehicleType] || 100;
  return speedKmh > max || speedKmh < SPEED_MIN;
}

// ── GPS waypoint type ────────────────────────────────────────────────────────
interface Waypoint { lat: number; lng: number; ts: number; }

export interface RideSession {
  vehicleType: string;
  passengers: number;
  originLat: number;
  originLng: number;
  originTimestamp: string;
  originAccuracyM: number;
  destinationLat: number;
  destinationLng: number;
  destinationTimestamp: string;
  calculatedDistanceKm: number;
  calculatedDurationMin: number;
  avgSpeedKmh: number;
  speedFlagged: boolean;
  waypoints: Waypoint[];
  rideToken: string;
  estimatedEnb: number;
  // Captain's rating of the passenger — attached at session end
  passengerRating: number | null;
  passengerRatingComment: string | null;
}

interface Props {
  vehicleType: string;
  passengers: number;
  onRideComplete: (session: RideSession) => void;
  onCancel: () => void;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Phase: pre → riding → rating → ended
type Phase = 'pre' | 'riding' | 'rating' | 'ended';

export default function CarpoolSession({ vehicleType, passengers, onRideComplete, onCancel }: Props) {
  const [phase, setPhase] = useState<Phase>('pre');
  const [gpsReady, setGpsReady] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [originLat, setOriginLat] = useState<number | null>(null);
  const [originLng, setOriginLng] = useState<number | null>(null);
  const [originAccuracy, setOriginAccuracy] = useState(0);
  const [originTs, setOriginTs] = useState('');
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rideToken] = useState(generateToken);
  const [showQr, setShowQr] = useState(false);

  // ── Rating state (captain rates passenger at end) ────────────────────────
  const [passengerRating, setPassengerRating] = useState(0);
  const [passengerComment, setPassengerComment] = useState('');

  // ── Captured session data (filled when "End Ride" tapped) ───────────────
  const [pendingSession, setPendingSession] = useState<Omit<RideSession, 'passengerRating' | 'passengerRatingComment'> | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const waypointsRef = useRef<Waypoint[]>([]);

  // ── Acquire initial GPS ──────────────────────────────────────────────────
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setGpsReady(true);
      },
      () => setGpsError('GPS unavailable. Please enable location access.'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, []);

  // ── Load Leaflet map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!gpsReady || !mapRef.current || mapInstanceRef.current) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, [gpsReady]);

  const initMap = useCallback(() => {
    if (!mapRef.current || !currentLat || !currentLng) return;
    const L = (window as any).L;
    const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false })
      .setView([currentLat, currentLng], 15);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const icon = L.divIcon({
      html: `<div style="width:18px;height:18px;background:#1A6B3C;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      className: '', iconSize: [18, 18], iconAnchor: [9, 9],
    });
    markerRef.current = L.marker([currentLat, currentLng], { icon }).addTo(map);
    polylineRef.current = L.polyline([], { color: '#1A6B3C', weight: 4, opacity: 0.8 }).addTo(map);
  }, [currentLat, currentLng]);

  // ── Update map marker as GPS changes ────────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || currentLat == null || currentLng == null) return;
    if (markerRef.current) markerRef.current.setLatLng([currentLat, currentLng]);
    if (phase === 'riding' && polylineRef.current) {
      const pts = waypointsRef.current.map(w => [w.lat, w.lng]);
      polylineRef.current.setLatLngs(pts);
      mapInstanceRef.current.panTo([currentLat, currentLng]);
    }
  }, [currentLat, currentLng, phase]);

  // ── Start Ride ───────────────────────────────────────────────────────────
  const handleStartRide = () => {
    if (!currentLat || !currentLng) return;
    const now = new Date().toISOString();
    setOriginLat(currentLat);
    setOriginLng(currentLng);
    setOriginTs(now);
    startTimeRef.current = Date.now();
    setPhase('riding');

    const wp: Waypoint = { lat: currentLat, lng: currentLng, ts: Date.now() };
    waypointsRef.current = [wp];
    setWaypoints([wp]);

    timerRef.current = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLat(lat);
        setCurrentLng(lng);
        const last = waypointsRef.current[waypointsRef.current.length - 1];
        const dist = last ? haversineKm(last.lat, last.lng, lat, lng) * 1000 : 999;
        if (dist > 20 || Date.now() - (last?.ts || 0) > 10000) {
          const newWp = { lat, lng, ts: Date.now() };
          waypointsRef.current = [...waypointsRef.current, newWp];
          setWaypoints(prev => [...prev, newWp]);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  // ── End Ride — capture session, move to rating screen ───────────────────
  const handleEndRide = () => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (!originLat || !originLng || !currentLat || !currentLng) return;

    const destTs = new Date().toISOString();
    const distKm = haversineKm(originLat, originLng, currentLat, currentLng);
    const durationMin = elapsedSec / 60;
    const avgSpeed = durationMin > 0 ? (distKm / durationMin) * 60 : 0;
    const flagged = calcSpeedFlag(vehicleType, distKm, durationMin);
    const enb = calcRideEnb(vehicleType, distKm, passengers);

    // Store the session data — do not call onRideComplete yet
    setPendingSession({
      vehicleType, passengers,
      originLat, originLng,
      originTimestamp: originTs,
      originAccuracyM: originAccuracy,
      destinationLat: currentLat,
      destinationLng: currentLng,
      destinationTimestamp: destTs,
      calculatedDistanceKm: Math.round(distKm * 100) / 100,
      calculatedDurationMin: Math.round(durationMin * 10) / 10,
      avgSpeedKmh: Math.round(avgSpeed * 10) / 10,
      speedFlagged: flagged,
      waypoints: waypointsRef.current,
      rideToken,
      estimatedEnb: enb,
    });

    // Move to rating screen
    setPhase('rating');
  };

  // ── Submit rating and complete session ───────────────────────────────────
  const handleSubmitRating = (skip = false) => {
    if (!pendingSession) return;
    setPhase('ended');
    onRideComplete({
      ...pendingSession,
      passengerRating: skip ? null : (passengerRating || null),
      passengerRatingComment: skip ? null : (passengerComment.trim() || null),
    });
  };

  // ── Cleanup on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const estimatedKm = (originLat && currentLat && originLng && currentLng)
    ? Math.round(haversineKm(originLat, originLng, currentLat, currentLng) * 100) / 100
    : 0;
  const estimatedEnb = calcRideEnb(vehicleType, estimatedKm || 0.1, passengers);

  // ── Rating screen — shown after "End Ride" ───────────────────────────────
  if (phase === 'rating') {
    return (
      <div className="space-y-4">
        <div className="text-center space-y-1 pt-2">
          <div className="w-16 h-16 rounded-full bg-enb-green/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏁</span>
          </div>
          <h2 className="text-lg font-bold text-enb-text-primary">Ride Complete</h2>
          <p className="text-sm text-enb-text-secondary">
            How was your passenger?
          </p>
        </div>

        <Card className="border-gray-100 p-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-enb-text-primary">Rate your passenger</p>
            <p className="text-xs text-gray-400">
              Were they on time, respectful, and at the correct pickup point?
            </p>
          </div>

          <div className="flex justify-center">
            <StarRating
              value={passengerRating}
              onChange={setPassengerRating}
              size="md"
              showLabel
            />
          </div>

          {passengerRating > 0 && (
            <div>
              <textarea
                value={passengerComment}
                onChange={e => setPassengerComment(e.target.value.slice(0, 80))}
                placeholder="Any comments? (optional)"
                className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none h-14 focus:outline-none focus:border-enb-green"
              />
              <p className="text-xs text-gray-400 text-right">{passengerComment.length}/80</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Ratings are blind — your passenger cannot see your rating until they have also rated you.
          </p>
        </Card>

        <div className="space-y-2">
          <Button
            onClick={() => handleSubmitRating(false)}
            disabled={passengerRating === 0}
            className="w-full h-12 bg-enb-green hover:bg-enb-green/90 text-white disabled:opacity-50"
          >
            Submit Rating & Finish
          </Button>
          <button
            onClick={() => handleSubmitRating(true)}
            className="w-full text-sm text-gray-400 py-2 hover:text-gray-600 transition-colors"
          >
            Skip rating
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-gray-200"
        style={{ height: 260 }}
      />

      {/* GPS error */}
      {gpsError && (
        <div className="p-3 bg-red-50 rounded-xl flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {gpsError}
        </div>
      )}

      {/* Stats bar */}
      {phase === 'riding' && (
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center border-gray-100">
            <Clock className="w-4 h-4 text-enb-teal mx-auto mb-1" />
            <div className="text-lg font-bold text-enb-text-primary font-mono">{formatTime(elapsedSec)}</div>
            <div className="text-xs text-gray-400">Duration</div>
          </Card>
          <Card className="p-3 text-center border-gray-100">
            <Navigation className="w-4 h-4 text-enb-green mx-auto mb-1" />
            <div className="text-lg font-bold text-enb-text-primary">{estimatedKm} km</div>
            <div className="text-xs text-gray-400">Distance</div>
          </Card>
          <Card className="p-3 text-center border-gray-100">
            <Users className="w-4 h-4 text-enb-gold mx-auto mb-1" />
            <div className="text-lg font-bold text-enb-gold">{estimatedEnb}</div>
            <div className="text-xs text-gray-400">Est. $ENB</div>
          </Card>
        </div>
      )}

      {/* Ride token / QR */}
      {phase === 'riding' && (
        <Card className="border-enb-green/20 bg-enb-green/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-enb-text-secondary mb-0.5">Ride PIN for passengers</p>
              <p className="text-2xl font-bold font-mono tracking-widest text-enb-green">{rideToken}</p>
              <p className="text-xs text-gray-400 mt-0.5">Valid for 2 hours after ride ends</p>
            </div>
            <button
              onClick={() => setShowQr(v => !v)}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-white border border-enb-green/30 text-enb-green"
            >
              <QrCode className="w-6 h-6" />
              <span className="text-xs font-medium">Show QR</span>
            </button>
          </div>
          {showQr && (
            <div className="mt-3 flex flex-col items-center gap-2">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://app.econeighbor.org/confirm-ride/${rideToken}`)}`}
                alt="Ride QR"
                className="rounded-xl border-4 border-white shadow-md"
              />
              <p className="text-xs text-gray-400 text-center">
                ENB members → scan opens app confirmation<br/>
                Non-members → scan opens web confirmation
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Pre-ride info */}
      {phase === 'pre' && (
        <Card className="border-gray-100 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-enb-text-primary">
            <span className="font-semibold">{vehicleType}</span>
            <span className="text-gray-400">·</span>
            <Users className="w-4 h-4 text-gray-400" />
            <span>{passengers} passenger{passengers > 1 ? 's' : ''}</span>
          </div>
          <div className="text-xs text-gray-400">
            GPS is {gpsReady ? '✅ ready' : '⏳ acquiring...'}
          </div>
        </Card>
      )}

      {/* Action buttons */}
      {phase === 'pre' && (
        <div className="space-y-2">
          <Button
            onClick={handleStartRide}
            disabled={!gpsReady}
            className="w-full h-14 text-lg bg-enb-green hover:bg-enb-green/90 text-white shadow-lg shadow-enb-green/20 disabled:opacity-50"
          >
            {gpsReady ? '🚗 Start Ride' : 'Acquiring GPS...'}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full text-gray-400">
            Cancel
          </Button>
        </div>
      )}

      {phase === 'riding' && (
        <Button
          onClick={handleEndRide}
          className="w-full h-14 text-lg bg-red-500 hover:bg-red-600 text-white shadow-lg"
        >
          🏁 End Ride
        </Button>
      )}
    </div>
  );
}
