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

// ── GPS CONSTANTS — TAXONOMY ────────────────────────────────────────────────
// ENB uses four distinct GPS checks. Each has a different threshold and scope.
// Never conflate them — they answer different questions.
//
// 1. MAX_GPS_DRIFT_METRES (20m)
//    Before→After location drift for transformation actions.
//    "Did the user return to the same spot for their After photo?"
//    Whitepaper canonical: 20m. Used in: AfterPhotoSubmission.tsx only.
//    Stored in: submissions.gps_out_of_range (boolean)
//
// 2. GPS_ACCURACY_THRESHOLD_M (100m)
//    Device GPS signal quality at submission time.
//    "Is this device's GPS signal reliable enough to trust?"
//    >100m = WiFi/indoor positioning — forces human review regardless of AI verdict.
//    Used in: ActionForm.tsx, SubmitAction.tsx.
//    Stored in: submissions.gps_accuracy_m (numeric, raw metres)
//
// 3. GPS_DUPLICATE_RADIUS_M (10m)
//    Repeat submission fraud detection.
//    "Has this user submitted the same action from this exact spot recently?"
//    Checks last 30 days, same action_type, within 10m → flags for human review.
//    Used in: SubmitAction.tsx.
//    Stored in: submissions.gps_duplicate_flag (boolean)
//
// 4. GPS boundary polygon check (Phase 2 — not yet implemented)
//    Neighbourhood boundary enforcement.
//    "Is this submission inside the user's registered neighbourhood?"
//    Requires neighbourhood_boundaries table with polygon data per neighbourhood.
//    Stored in: submissions.gps_outside_boundary (boolean, Phase 2 column)
// ─────────────────────────────────────────────────────────────────────────────

/** Before→After drift tolerance for transformation actions (whitepaper canonical: 20m) */
export const MAX_GPS_DRIFT_METRES = 20;

/** Device GPS accuracy threshold — submissions above this go to human review (100m) */
export const GPS_ACCURACY_THRESHOLD_M = 100;

/** Duplicate submission detection radius — same location, same action, last 30 days (10m) */
export const GPS_DUPLICATE_RADIUS_M = 10;

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
 * Returns time remaining until after_unlocks_at as { hrs, mins, secs, totalMs }
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
 * Haversine distance in metres between two GPS points.
 * Used for: Before→After drift check, duplicate GPS detection.
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
