import { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, CheckCircle, Loader2, AlertCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ActionFormProps {
  actionType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const MAX_PHOTOS = 5;

// Behavioural CAPTCHA — 15 questions, randomised correct answer positions
const CAPTCHA_QUESTIONS = [
  { q: 'Kaunsa kaam ek achha shehri karta hai?', options: ['Kachra bin mein daalna', 'Sadak par phenkna'], correct: 0 },
  { q: 'Apne mohalle ki safai karna kaisi baat hai?', options: ['Galat hai, bekar kaam', 'Bahut achhi baat hai'], correct: 1 },
  { q: 'Dost ko recycle karne ki targhib dena?', options: ['Bilkul sahi hai', 'Bekar kaam hai'], correct: 0 },
  { q: 'Paani ki boond boond bachana kyun zaroori hai?', options: ['Zaroori nahi', 'Paani qeemti cheez hai'], correct: 1 },
  { q: 'Bijli bachane se kya hota hai?', options: ['Kuch nahi hota', 'Paisa bachta hai aur maahol behtar hota hai'], correct: 1 },
  { q: 'Sadak par kachra phenkna?', options: ['Bilkul galat hai', 'Thik hai agar koi na dekhe'], correct: 0 },
  { q: 'Darak hue nalkay ki marammat karwana kyun zaroori hai?', options: ['Zaroori nahi', 'Paani barbad hone se rokta hai'], correct: 1 },
  { q: 'Apne ghar ke qareeb koi pauda lagana?', options: ['Faaida nahi', 'Maahol ke liye bahut acha hai'], correct: 1 },
  { q: 'What is the right thing to do with plastic waste?', options: ['Throw it on the street', 'Put it in the recycling bin'], correct: 1 },
  { q: 'Why should we save water?', options: ['Water is precious and scarce', 'There is no reason to save it'], correct: 0 },
  { q: 'Planting a tree in your neighbourhood is:', options: ['A waste of time', 'Good for air quality and the environment'], correct: 1 },
  { q: 'If you see litter on the street, the right action is:', options: ['Pick it up and bin it', 'Ignore it — not your problem'], correct: 0 },
  { q: 'Turning off lights when leaving a room helps:', options: ['Save electricity and reduce bills', 'Nothing at all'], correct: 0 },
  { q: 'Composting food scraps instead of throwing them away:', options: ['Is too much effort', 'Reduces waste and helps soil'], correct: 1 },
  { q: 'Encouraging your neighbours to keep streets clean is:', options: ['A community responsibility', 'Not your concern'], correct: 0 },
];

interface PhotoItem {
  preview: string;       // base64 for display
  cloudinaryUrl: string | null;  // uploaded URL
  uploading: boolean;
  file: File;
}

export default function ActionForm({ actionType, onSubmit, onBack }: ActionFormProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [description, setDescription] = useState('');
  const [gpsLat, setGpsLat] = useState<number | null>(null);
  const [gpsLng, setGpsLng] = useState<number | null>(null);
  const [gpsAddress, setGpsAddress] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [captchaIdx] = useState(() => Math.floor(Math.random() * CAPTCHA_QUESTIONS.length));
  const [captchaAnswer, setCaptchaAnswer] = useState<number | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const [formStartTime] = useState(Date.now());
  const [touchEvents, setTouchEvents] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const captcha = CAPTCHA_QUESTIONS[captchaIdx];

  useEffect(() => {
    const handler = () => setTouchEvents(n => n + 1);
    window.addEventListener('touchstart', handler, { passive: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const openCamera = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.muted = true;
          const p = videoRef.current.play();
          if (p !== undefined) p.catch(() => videoRef.current?.play());
        }
      }, 100);
    } catch (err: any) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Camera access denied. Civic action photos must be taken live — gallery uploads not accepted.'
      );
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `action_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg', 0.8);

      // Add photo to list immediately
      const newPhoto: PhotoItem = { preview, cloudinaryUrl: null, uploading: true, file };
      setPhotos(prev => [...prev, newPhoto]);

      // Stop camera after capture
      streamRef.current?.getTracks().forEach(t => t.stop());
      setCameraActive(false);

      // Upload this photo
      uploadPhoto(file, preview);
    }, 'image/jpeg', 0.85);
  };

  const uploadPhoto = async (file: File, preview: string) => {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dl86obm3b';
      const preset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'enb_photos';
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);
      formData.append('folder', 'enb_submissions');
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST', body: formData,
      });
      const data = await res.json();
      // Update the photo item by matching on preview (unique per capture)
      setPhotos(prev => prev.map(p =>
        p.preview === preview
          ? { ...p, cloudinaryUrl: data.secure_url || null, uploading: false }
          : p
      ));
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setPhotos(prev => prev.map(p =>
        p.preview === preview ? { ...p, uploading: false } : p
      ));
    }
  };

  const removePhoto = (preview: string) => {
    setPhotos(prev => prev.filter(p => p.preview !== preview));
  };

  const handleGetLocation = () => {
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude);
        setGpsLng(pos.coords.longitude);
        setGpsAddress(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLoadingLocation(false);
      },
      () => setLoadingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = () => {
    if (photos.length === 0 || !description || !gpsLat) return;
    if (captchaAnswer === null) { setCaptchaFailed(true); return; }
    if (captchaAnswer !== captcha.correct) { setCaptchaFailed(true); return; }

    const timeMs = Date.now() - formStartTime;
    const timeScore = Math.min(timeMs / 10000, 1);
    const touchScore = Math.min(touchEvents / 5, 1);
    const captchaScore = (timeScore * 0.4 + touchScore * 0.3 + 0.3);

    const uploadedUrls = photos.filter(p => p.cloudinaryUrl).map(p => p.cloudinaryUrl as string);

    onSubmit({
      actionType,
      photo: uploadedUrls[0] || photos[0].preview,       // primary photo (backward compat)
      photoUrls: uploadedUrls.length > 0 ? uploadedUrls : photos.map(p => p.preview),
      photoCount: photos.length,
      description,
      gpsLat,
      gpsLng,
      gpsAddress,
      imageSource: 'CAMERA',
      captchaScore: parseFloat(captchaScore.toFixed(2)),
      timestamp: new Date().toISOString(),
    });
  };

  const anyUploading = photos.some(p => p.uploading);
  const canSubmit = photos.length > 0 && !anyUploading && description.trim().length > 10 && gpsLat && captchaAnswer !== null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" onClick={onBack} className="text-enb-text-secondary -ml-2">Back</Button>
        <h2 className="text-xl font-bold text-enb-text-primary capitalize">{actionType.replace(/_/g, ' ')}</h2>
        <div className="w-10" />
      </div>

      {/* Photo Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-enb-text-primary">
            Live Photo Proof <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS} photos</span>
        </div>

        {/* Camera viewfinder */}
        {cameraActive && (
          <div className="relative rounded-xl overflow-hidden bg-black">
            <video
              ref={videoRef} autoPlay playsInline muted
              className="w-full max-h-64 object-cover rounded-xl"
              onClick={() => videoRef.current?.play()}
            />
            <canvas ref={canvasRef} className="hidden" />
            <Button
              onClick={capturePhoto}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white text-enb-green border-4 border-enb-green hover:bg-enb-green hover:text-white"
            >
              <Camera className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Photo thumbnails strip */}
        {photos.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {photos.map((photo, idx) => (
              <div key={photo.preview} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0">
                <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />

                {/* Uploading overlay */}
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}

                {/* Uploaded badge */}
                {!photo.uploading && photo.cloudinaryUrl && (
                  <div className="absolute bottom-1 left-1 bg-enb-green text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    ✓
                  </div>
                )}

                {/* Remove button */}
                {!photo.uploading && (
                  <button
                    onClick={() => removePhoto(photo.preview)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Add more button */}
            {photos.length < MAX_PHOTOS && !cameraActive && (
              <button
                onClick={openCamera}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 flex flex-col items-center justify-center gap-1 text-enb-green transition-colors flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="text-xs font-medium">Add</span>
              </button>
            )}
          </div>
        )}

        {/* First photo — open camera button */}
        {photos.length === 0 && !cameraActive && (
          <div>
            <Button
              onClick={openCamera}
              className="w-full h-24 border-2 border-dashed border-enb-green bg-enb-green/5 hover:bg-enb-green/10 text-enb-green flex flex-col gap-2 rounded-xl"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Open Camera</span>
            </Button>
            {cameraError && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {cameraError}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1 text-center">Gallery uploads not accepted — live photos only</p>
          </div>
        )}

        {photos.length > 0 && (
          <p className="text-xs text-gray-400">
            {photos.length === MAX_PHOTOS
              ? `Maximum ${MAX_PHOTOS} photos reached.`
              : `Tap + to add more photos (up to ${MAX_PHOTOS} total)`}
          </p>
        )}
      </div>

      {/* GPS Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">GPS Location <span className="text-red-500">*</span></label>
        <div
          onClick={!gpsAddress ? handleGetLocation : undefined}
          className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${gpsAddress ? 'bg-enb-green/10 border-enb-green/20 text-enb-green' : 'bg-white border-gray-200 text-gray-500 cursor-pointer hover:bg-gray-50'}`}
        >
          {loadingLocation ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
          <span className="text-sm font-medium">
            {gpsAddress ? `📍 ${gpsAddress}` : loadingLocation ? 'Detecting...' : 'Tap to detect GPS location'}
          </span>
          {gpsAddress && <CheckCircle className="w-4 h-4 ml-auto" />}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-enb-text-primary">Description <span className="text-red-500">*</span></label>
        <Textarea
          placeholder="Describe what you did in detail (min. 10 characters)..."
          className="h-28 resize-none bg-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-xs text-gray-400">{description.length}/500 characters</p>
      </div>

      {/* Behavioural CAPTCHA */}
      <div className="space-y-2 bg-enb-green/5 border border-enb-green/20 rounded-xl p-4">
        <label className="text-sm font-bold text-enb-text-primary">Quick Check 🌿</label>
        <p className="text-sm text-enb-text-secondary">{captcha.q}</p>
        <div className="flex flex-col gap-2 mt-2">
          {captcha.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => { setCaptchaAnswer(i); setCaptchaFailed(false); }}
              className={`text-left p-3 rounded-lg border text-sm font-medium transition-all ${captchaAnswer === i ? 'bg-enb-green text-white border-enb-green' : 'bg-white border-gray-200 text-enb-text-primary hover:border-enb-green'}`}
            >
              {opt}
            </button>
          ))}
        </div>
        {captchaFailed && (
          <p className="text-sm text-red-500 mt-1">⚠️ Please answer the question correctly to continue.</p>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-12 text-lg shadow-lg shadow-enb-green/20 bg-enb-green hover:bg-enb-green/90 text-white"
      >
        {anyUploading
          ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Uploading photos...</>
          : 'Review Submission'}
      </Button>
    </div>
  );
}
