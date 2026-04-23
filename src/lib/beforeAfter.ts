// ── Before/After System — Action Classification & Helpers ──────────────────
// Transformation actions require Before + After photo pairs.
// Point-in-time actions submit as single records (legacy behaviour).

export const TRANSFORMATION_ACTIONS = new Set([
  'neighbourhood_cleanup',
  'tree_planting',
  'community_painting',
  'infrastructure_repair',
  'community_garden',
  'drain_unclogging',
]);

export function isTransformationAction(actionType: string): boolean {
  return TRANSFORMATION_ACTIONS.has(actionType);
}

/** After-phase unlocks 4 hours after Stage A confirmation */
export const AFTER_UNLOCK_HOURS = 4;
export const AFTER_UNLOCK_MS = AFTER_UNLOCK_HOURS * 60 * 60 * 1000;

/** After GPS must be within 100 metres of Before GPS */
export const MAX_GPS_DRIFT_METRES = 100;

export type SubmissionPhase = 'before' | 'after' | null;

export interface TransformationSubmission {
  id: string;
  action_type: string;
  description: string;
  status: string;
  submission_phase: SubmissionPhase;
  after_submission_id: string | null;
  after_unlocks_at: string | null;
  parent_submission_id: string | null;
  gps_lat: number | null;
  gps_lng: number | null;
  gps_address: string | null;
  photo_urls: string[];
  enb_awarded: number;
  rep_awarded: number;
  submitted_at: string;
  confirmed_at: string | null;
}

/**
 * Returns time remaining until after_unlocks_at as { hrs, mins, totalMs }
 * If already unlocked, totalMs <= 0
 */
export function getTimeUntilUnlock(afterUnlocksAt: string): {
  hrs: number;
  mins: number;
  secs: number;
  totalMs: number;
} {
  const unlockTime = new Date(afterUnlocksAt).getTime();
  const now = Date.now();
  const totalMs = unlockTime - now;
  if (totalMs <= 0) return { hrs: 0, mins: 0, secs: 0, totalMs };
  const hrs = Math.floor(totalMs / (60 * 60 * 1000));
  const mins = Math.floor((totalMs % (60 * 60 * 1000)) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  return { hrs, mins, secs, totalMs };
}

export function isUnlocked(afterUnlocksAt: string | null): boolean {
  if (!afterUnlocksAt) return false;
  return Date.now() >= new Date(afterUnlocksAt).getTime();
}

/**
 * Haversine distance in metres between two GPS points
 */
export function gpsDistanceMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatActionLabel(actionType: string): string {
  return actionType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
