import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useUserStore } from '@/store/user';
import Layout from '@/components/layout/Layout';
import SplashScreen from '@/components/SplashScreen';
import { supabase } from '@/lib/supabase';
import ConfirmRide from '@/pages/submit/ConfirmRide';
import RiderProfile from '@/pages/submit/RiderProfile';
import AdminCaptains from '@/pages/submit/AdminCaptains';

// --- Eagerly loaded (core pages, always needed) ---
import Dashboard from '@/pages/Dashboard';
import SubmitAction from '@/pages/SubmitAction';
import Wallet from '@/pages/Wallet';
import BusinessDirectory from '@/pages/directory/BusinessDirectory';
import BusinessProfile from '@/pages/directory/BusinessProfile';
import PartnerSignup from '@/pages/directory/PartnerSignup';
import ScanRedemption from '@/pages/dashboard/ScanRedemption';
import Leaderboard from '@/pages/Leaderboard';
import ImpactDashboard from '@/pages/community/ImpactDashboard';
import Governance from '@/pages/community/Governance';
import FoodSharing from '@/pages/community/FoodSharing';
import Profile from '@/pages/Profile';
import MaturationBridge from '@/pages/wallet/MaturationBridge';
import GenerateRedemptionQR from '@/pages/wallet/GenerateRedemptionQR';
import ReferralHub from '@/pages/wallet/ReferralHub';
import Settings from '@/pages/Settings';
import More from '@/pages/More';
import MyLog from '@/pages/MyLog';
import ReportSubmission from '@/pages/ReportSubmission';
import BugReport from '@/pages/BugReport';
import AdminBugReports from '@/pages/admin/AdminBugReports';

// --- Admin pages ---
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SubmissionQueue from '@/pages/admin/SubmissionQueue';
import UserManagement from '@/pages/admin/UserManagement';
import CampaignManager from '@/pages/admin/CampaignManager';
import PartnerManager from '@/pages/admin/PartnerManager';
import BridgeManager from '@/pages/admin/BridgeManager';
import AnnouncementsPage from '@/pages/admin/AnnouncementsPage';
import OrgStructurePage from '@/pages/admin/org/OrgStructurePage';
import Inbox from '@/pages/Inbox';
import MessagesPage from '@/pages/Messages';

// --- Lazily loaded (newer pages, role-gated) ---
const FounderSale = lazy(() => import('@/pages/FounderSale'));
const FounderHardship = lazy(() => import('@/pages/FounderHardship'));
const PartnerFloat = lazy(() => import('@/pages/PartnerFloat'));
const ModQueue = lazy(() => import('@/pages/admin/ModQueue'));
const EscalationQueue = lazy(() => import('@/pages/admin/EscalationQueue'));
const MyHistory = lazy(() => import('@/pages/MyHistory'));
const SubmissionDetail = lazy(() => import('@/pages/SubmissionDetail'));
const CommunityIssues = lazy(() => import('@/pages/community/CommunityIssues'));
const Glossary = lazy(() => import('@/pages/Glossary'));

// --- Onboarding ---
import Welcome from '@/pages/onboarding/Welcome';
import About from '@/pages/onboarding/About';
import VersionHistory from '@/pages/about/VersionHistory';
import AccountRecovery from '@/pages/onboarding/AccountRecovery';
import BusinessOffers from '@/pages/business/BusinessOffers';
import BusinessDashboard from '@/pages/dashboard/BusinessDashboard';
import AdminOnboarding from '@/pages/admin/AdminOnboarding';
import OnboardingQueue from '@/pages/onboarding-team/OnboardingQueue';
import VolunteerApply from '@/pages/onboarding-team/VolunteerApply';
import BusinessHistory from '@/pages/business/BusinessHistory';
import SignUpStep1 from '@/pages/onboarding/SignUpStep1';
import SignUpStep2 from '@/pages/onboarding/SignUpStep2';
import OTPVerification from '@/pages/onboarding/OTPVerification';
import ConnectWallet from '@/pages/onboarding/ConnectWallet';
import Tutorial from '@/pages/onboarding/Tutorial';
import Login from '@/pages/onboarding/Login';
import ResetPassword from '@/pages/onboarding/ResetPassword';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import TermsAndConditions from '@/pages/legal/TermsAndConditions';
import TokenDisclaimer from '@/pages/legal/TokenDisclaimer';

// Fallback spinner for lazy-loaded pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { user, setUser } = useUserStore();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // ── ENB DOCTRINE: ONE flag — never let two profile loads run concurrently ──
  // Prevents the JWT-race double-fire: INITIAL_SESSION and TOKEN_REFRESHED can
  // both arrive within milliseconds of each other on page load. The ref is stable
  // across re-renders and does not cause re-renders itself.
  const isLoadingProfile = useRef(false);

  // ── ENB DOCTRINE: ONE realtime channel — created once, never duplicated ───
  // We track whether the global user-sync channel has been subscribed so we
  // never create a second subscription if onAuthStateChange fires twice.
  const realtimeSubscribed = useRef(false);

  // ── Helper: map a DB row → store shape ────────────────────────────────────
  const rowToUser = (row: any, fallbackEmail: string) => ({
    id: row.id,
    email: row.email || fallbackEmail,
    full_name: row.full_name || '',
    neighbourhood: row.neighbourhood || '',
    city: row.city || undefined,
    country_code: row.country_code || undefined,
    profession: row.profession || '',
    enb_local_bal: Number(row.enb_local_bal) || 0,
    enb_global_bal: Number(row.enb_global_bal) || 0,
    rep_score: Number(row.rep_score) || 0,
    tier: row.tier || 'Newcomer',
    role: row.role || 'member',
    wallet_address: row.wallet_address || undefined,
    whatsapp_number: row.whatsapp_number || undefined,
    profile_pic_url: row.profile_pic_url || undefined,
    lifetime_earned: Number(row.lifetime_earned) || 0,
    referred_by: row.referred_by || undefined,
    referral_code: row.referral_code || undefined,
    consecutive_absences: Number(row.consecutive_absences) || 0,
    cnic_number: row.cnic_number || undefined,
    cnic_photo_url: row.cnic_photo_url || undefined,
    cnic_verified: row.cnic_verified === true,
    cnic_submitted_at: row.cnic_submitted_at || undefined,
  });

  // ── Subscribe to real-time user row updates (called once after first success) ─
  const subscribeToUserUpdates = (userId: string) => {
    if (realtimeSubscribed.current) return;
    realtimeSubscribed.current = true;
    supabase
      .channel(`global-user-sync-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        if (payload.new && payload.new.id) {
          // ── ENB DOCTRINE: Functional update — never spread stale closure ──
          setUser((prev: any) => prev ? { ...prev, ...payload.new } : prev);
        }
      })
      .subscribe();
  };

  // ── Core profile loader ────────────────────────────────────────────────────
  // ONLY called from onAuthStateChange — never from getSession().
  // By the time onAuthStateChange fires, _recoverAndRefresh() is complete and
  // the JWT is guaranteed to be attached to all Supabase client requests.
  // This eliminates the root cause: anon-key-only requests returning 0 rows.
  const loadUserProfile = async (userId: string, userEmail: string) => {
    // Hard guard — never load with undefined/empty userId
    if (!userId || userId === 'undefined') return;
    // Concurrency guard — only one load in flight at a time
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;

    try {
      // ── Attempt 1: read the user row ──────────────────────────────────────
      // JWT is guaranteed attached at this point (called from onAuthStateChange).
      // maybeSingle: {data, null} on success | {null, error} on network/RLS error
      //              {null, null} should not occur when JWT is attached correctly.
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).maybeSingle();

      if (data) {
        setUser(rowToUser(data, userEmail));
        subscribeToUserUpdates(data.id);
        return;
      }

      if (error) {
        // ── RLS or network error — retry once after 1 second ─────────────
        // Should not happen with correct JWT, but network blips are real.
        // NEVER treat an error as "user doesn't exist".
        console.warn('[ENB] Profile read error — retrying in 1s:', error.message);
        await new Promise(r => setTimeout(r, 1000));
        const { data: retryData } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryData) {
          setUser(rowToUser(retryData, userEmail));
          subscribeToUserUpdates(retryData.id);
        } else {
          // Retry also failed — do NOT wipe store, do NOT insert.
          // The next TOKEN_REFRESHED will trigger another attempt.
          console.error('[ENB] Profile retry failed. Will retry on next auth event.');
        }
        return;
      }

      // ── data===null, error===null ─────────────────────────────────────────
      // This branch should genuinely only fire for brand-new registrations
      // where SignUpStep2 hasn't inserted the row yet. The INSERT below is
      // intentionally minimal — SignUpStep2 fills the remaining fields.
      //
      // ── SAFETY CHECK: verify this userId doesn't already exist ───────────
      // Re-read with explicit error checking before inserting. If we somehow
      // still can't read due to a transient issue, bail out — never insert blind.
      const { data: safetyCheck, error: safetyError } = await supabase
        .from('users').select('id').eq('id', userId).maybeSingle();

      if (safetyCheck) {
        // Row EXISTS — we just couldn't read all of it earlier. Fetch full row now.
        const { data: fullRow } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (fullRow) {
          setUser(rowToUser(fullRow, userEmail));
          subscribeToUserUpdates(fullRow.id);
        }
        return;
      }

      if (safetyError) {
        // Cannot confirm row existence — bail out, do not insert.
        console.warn('[ENB] Cannot confirm row existence. Aborting insert to prevent phantom.');
        return;
      }

      // ── Confirmed new user — safe to insert ──────────────────────────────
      console.warn('[ENB] No profile row — inserting new member row for:', userId);
      const { data: insertedRow, error: insertError } = await supabase
        .from('users').insert({
          id: userId, email: userEmail, full_name: '',
          enb_local_bal: 0, enb_global_bal: 0, rep_score: 0,
          tier: 'Newcomer', role: 'member', is_active: true,
        }).select().single();

      if (insertedRow) {
        setUser(rowToUser(insertedRow, userEmail));
        subscribeToUserUpdates(insertedRow.id);
      } else if (insertError) {
        // Duplicate key — row exists but was somehow invisible. Read it now.
        console.warn('[ENB] Insert conflict — reading existing row:', insertError.message);
        await new Promise(r => setTimeout(r, 500));
        const { data: conflictRead } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (conflictRead) {
          setUser(rowToUser(conflictRead, userEmail));
          subscribeToUserUpdates(conflictRead.id);
        }
      }
    } catch (err) {
      // Never wipe store on exception — leave it as-is.
      console.error('[ENB] Profile load exception — store unchanged:', err);
    } finally {
      isLoadingProfile.current = false;
    }
  };

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) setShowSplash(false);

    // ── ENB DOCTRINE: Do NOT use getSession() to trigger loadUserProfile ───
    // getSession() returns the cached localStorage session at T=0ms, BEFORE
    // Supabase's _recoverAndRefresh() has attached the JWT to request headers.
    // Any DB call made at that point fires with anon-key only → auth.uid()=null
    // → RLS fails → maybeSingle returns {null, null} → phantom INSERT triggered.
    //
    // The correct pattern (Supabase v2 docs) is to rely entirely on
    // onAuthStateChange for initialization. The INITIAL_SESSION event fires
    // AFTER _recoverAndRefresh() completes — JWT is guaranteed attached.
    //
    // We still call getSession() here, but ONLY to set authChecked so the
    // loading spinner resolves. We do NOT trigger loadUserProfile from it.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        // No session at all — user is logged out. Show Welcome page.
        setAuthChecked(true);
      }
      // If session exists: do NOT call loadUserProfile here.
      // onAuthStateChange will fire INITIAL_SESSION/SIGNED_IN shortly after
      // with JWT attached — let that handle profile loading.
      // authChecked will be set there once profile load completes.
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ── SIGNED_OUT: only act on explicit logout ───────────────────────────
      // Supabase fires SIGNED_OUT on tab switching, backgrounding, and internal
      // session rotation. Only More.tsx/AccountSwitcher explicit logout calls
      // logout() to wipe the store. Ignore all Supabase-initiated SIGNED_OUTs.
      if (event === 'SIGNED_OUT') return;

      // ── USER_UPDATED: ignore — fires on every auth.users row UPDATE ───────
      // Our update_last_seen RPC touches public.users, not auth.users, so
      // USER_UPDATED should be rare. Either way, we never reload profile on it.
      if (event === 'USER_UPDATED') return;

      // ── Handle all session-carrying events ────────────────────────────────
      // INITIAL_SESSION: fires on page load after _recoverAndRefresh() completes.
      //                  JWT is guaranteed attached. This replaces getSession() init.
      // SIGNED_IN:       fires after explicit login OR after account switch.
      // TOKEN_REFRESHED: fires every ~3600s or on tab focus (Supabase auto-refresh).
      if (
        (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
        && session?.user
      ) {
        const refreshedId = session.user.id;
        if (!refreshedId) return;

        const currentUserId = useUserStore.getState().user?.id;

        if (currentUserId && currentUserId === refreshedId) {
          // ── Same user, token refreshed — store is correct, do nothing ────
          // This is the most common path after initial load: TOKEN_REFRESHED
          // fires, we verify same user, skip entirely. Zero loadUserProfile calls.
          if (!authChecked) setAuthChecked(true);
          return;
        }

        if (!currentUserId) {
          // ── No user in store: fresh page load or session restore ──────────
          // JWT is now attached (we're in onAuthStateChange, not getSession).
          // Safe to load profile.
          await loadUserProfile(refreshedId, session.user.email ?? '');
          setAuthChecked(true);
          return;
        }

        // ── Different userId in store vs token ────────────────────────────
        // Legitimate account switch: AccountSwitcher.handleSwitch called
        // supabase.auth.setSession() → SIGNED_IN fires with new userId.
        // Load the new user's profile.
        await loadUserProfile(refreshedId, session.user.email ?? '');
        setAuthChecked(true);
      }

      // ── INITIAL_SESSION with null session = definitely logged out ─────────
      if (event === 'INITIAL_SESSION' && !session) {
        setAuthChecked(true);
      }
    });

    // Safety net: if onAuthStateChange never fires (e.g. no network),
    // unblock the UI after 5s so the user isn't stuck on a spinner.
    const authTimeout = setTimeout(() => setAuthChecked(true), 5000);
    return () => { subscription.unsubscribe(); clearTimeout(authTimeout); };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-enb-surface flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your account...</p>
      </div>
    );
  }

  return (
    <LanguageProvider>
    <Router>
      <div className="font-sans text-enb-text-primary selection:bg-enb-green/20">
        <Routes>
          {/* Signup routes — always available (even when logged in) */}
          <Route path="/signup/step1" element={<SignUpStep1 />} />
          <Route path="/signup/step2" element={<SignUpStep2 />} />
          <Route path="/otp-verify" element={<OTPVerification />} />
          <Route path="/about" element={<About />} />
          <Route path="/dev-history" element={<VersionHistory />} />
          <Route path="/account-recovery" element={<AccountRecovery />} />
          <Route path="/confirm-ride/:token" element={<ConfirmRide />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/token-disclaimer" element={<TokenDisclaimer />} />

          {user ? (
            <>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="queue" element={<SubmissionQueue />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="campaigns" element={<CampaignManager />} />
                <Route path="partners" element={<PartnerManager />} />
                <Route path="bridge" element={<BridgeManager />} />
                <Route path="mod-queue" element={<ModQueue />} />
                <Route path="escalation" element={<EscalationQueue />} />
                <Route path="bugs" element={<AdminBugReports />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
                <Route path="announcements" element={<AnnouncementsPage />} />
                <Route path="org-structure" element={<OrgStructurePage />} />
                <Route path="captains" element={<AdminCaptains />} />
              </Route>
              <Route path="/*" element={
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/submit" element={<SubmitAction />} />
                      <Route path="/wallet" element={<Wallet />} />
                      <Route path="/directory" element={<BusinessDirectory />} />
                      <Route path="/directory/:id" element={<BusinessProfile />} />
                      <Route path="/partner-signup" element={<PartnerSignup />} />
                      <Route path="/scan" element={<ScanRedemption />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/impact" element={<ImpactDashboard />} />
                      <Route path="/governance" element={<Governance />} />
                      <Route path="/food-sharing" element={<FoodSharing />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/bridge" element={<MaturationBridge />} />
                      <Route path="/wallet/redeem" element={<GenerateRedemptionQR />} />
                      <Route path="/wallet/referrals" element={<ReferralHub />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/more" element={<More />} />
                      <Route path="/my-log" element={<MyLog />} />
                      <Route path="/mod-queue" element={<ModQueue />} />
                      <Route path="/history" element={<MyHistory />} />
                      <Route path="/submission/:id" element={<SubmissionDetail />} />
                      <Route path="/issues" element={<CommunityIssues />} />
                      <Route path="/rider/:userId" element={<RiderProfile />} />
                      <Route path="/glossary" element={<Glossary />} />
                      <Route path="/report" element={<ReportSubmission />} />
                      <Route path="/bug-report" element={<BugReport />} />
                      <Route path="/inbox" element={<Inbox />} />
                      <Route path="/messages" element={<MessagesPage />} />
                      <Route path="/messages/:userId" element={<MessagesPage />} />
                      <Route path="/onboarding-queue" element={<OnboardingQueue />} />
                      <Route path="/volunteer-apply" element={<VolunteerApply />} />
                      <Route path="/business" element={<BusinessDashboard />} />
                      <Route path="/business/offers" element={<BusinessOffers />} />
                      <Route path="/business/history" element={<BusinessHistory />} />
                      <Route path="/founder-sale" element={<FounderSale />} />
                      <Route path="/founder-hardship" element={<FounderHardship />} />
                      <Route path="/partner-float" element={<PartnerFloat />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </Layout>
              } />
            </>
          ) : (
            <>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding/wallet" element={<ConnectWallet />} />
              <Route path="/onboarding/tutorial" element={<Tutorial />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
    </LanguageProvider>
  );
}
