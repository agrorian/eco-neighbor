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
  // ── Tracks whether a Supabase session exists in localStorage ──────────────
  // Used to show a loading spinner instead of the Welcome page during the
  // 50-200ms window between authChecked=true and the store being populated.
  // Without this: user=null briefly → Welcome page flashes → jarring redirect.
  const [sessionExists, setSessionExists] = useState(false);

  // ── ENB DOCTRINE: Race guard — one profile load in flight at a time ───────
  const isLoadingProfile = useRef(false);

  // ── FIX #1: Store the realtime channel ref so it can be cleaned up ────────
  // Root cause: previously the channel was created inside loadUserProfile with
  // no reference stored. Every call to loadUserProfile created a NEW channel
  // (same name, duplicate subscription). Channels accumulated and never cleaned
  // up, causing multiple conflicting setUser calls on every users table UPDATE.
  // Fix: store in a ref, check before creating, clean up on useEffect unmount.
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Helper: map a DB row to the store shape ────────────────────────────────
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

  // ── FIX #2: Subscribe realtime ONCE, outside loadUserProfile ─────────────
  // Root cause: channel was created inside loadUserProfile. Every successful
  // profile load created a duplicate channel. Now: one channel, set up once,
  // stored in realtimeChannelRef, properly cleaned up on unmount.
  const subscribeRealtime = (userId: string) => {
    // Already subscribed for this user — do not create a duplicate
    if (realtimeChannelRef.current) return;

    const ch = supabase
      .channel(`global-user-sync-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        if (payload.new && payload.new.id) {
          setUser((prev: any) => prev ? { ...prev, ...payload.new } : prev);
        }
      })
      .subscribe();

    realtimeChannelRef.current = ch;
  };

  const loadUserProfile = async (userId: string, userEmail: string) => {
    if (!userId || userId === 'undefined') return;
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;

    try {
      // ── FIX #3: Use supabase.auth.getUser() FIRST to guarantee a valid JWT ──
      // Root cause: maybeSingle() was fired immediately after getSession(). On
      // page load, getSession() reads the JWT from localStorage. If the JWT is
      // expired, PostgREST evaluates the request as anonymous → RLS fails silently
      // → {data:null, error:null} → INSERT ghost row → store gets blank user.
      //
      // supabase.auth.getUser() contacts the Supabase Auth server directly. It:
      //   (a) validates the JWT,
      //   (b) refreshes it if expired before returning,
      //   (c) returns the real authenticated user or an error.
      // This guarantees the JWT is fresh before we hit the DB.
      // Cost: one extra network call on page load. Worth it — eliminates the race.
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData?.user) {
        // Not authenticated — clear any stale store state and stop.
        // This is a legitimate logged-out state, not a phantom.
        console.warn('getUser failed — user not authenticated:', authError?.message);
        // Do NOT setUser(null) here — let the SIGNED_OUT flow handle it.
        return;
      }

      // Use the verified userId from the auth server (authoritative)
      const verifiedUserId = authData.user.id;
      const verifiedEmail  = authData.user.email || userEmail;

      // Fetch the public profile row — JWT is now guaranteed valid
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', verifiedUserId)
        .maybeSingle();

      if (data) {
        // Happy path: row found, populate store, subscribe realtime
        setUser(rowToUser(data, verifiedEmail));
        subscribeRealtime(verifiedUserId);
        return;
      }

      if (error) {
        // RLS or network blocked the read even with a fresh JWT.
        // This should be extremely rare now that getUser() guarantees a valid token.
        // Retry once after a short delay.
        console.warn('Profile read blocked after getUser() — retrying in 800ms.', error.message);
        await new Promise(r => setTimeout(r, 800));
        const { data: retryData } = await supabase
          .from('users')
          .select('*')
          .eq('id', verifiedUserId)
          .maybeSingle();
        if (retryData) {
          setUser(rowToUser(retryData, verifiedEmail));
          subscribeRealtime(verifiedUserId);
        } else {
          console.error('Profile retry also failed. Store left untouched.');
        }
        return;
      }

      // data===null, error===null: genuine 0 rows — new user, safe to INSERT
      console.warn('No profile row found — creating new member row for:', verifiedUserId);
      const { data: insertedRow, error: insertError } = await supabase
        .from('users').insert({
          id: verifiedUserId,
          email: verifiedEmail,
          full_name: '',
          enb_local_bal: 0,
          enb_global_bal: 0,
          rep_score: 0,
          tier: 'Newcomer',
          role: 'member',
          is_active: true,
        }).select().single();

      if (insertedRow) {
        setUser(rowToUser(insertedRow, verifiedEmail));
        subscribeRealtime(verifiedUserId);
      } else if (insertError) {
        // Duplicate key — row exists but the first read missed it (very rare race).
        console.warn('INSERT duplicate — retrying read.', insertError.message);
        await new Promise(r => setTimeout(r, 500));
        const { data: fallbackRead } = await supabase
          .from('users').select('*').eq('id', verifiedUserId).maybeSingle();
        if (fallbackRead) {
          setUser(rowToUser(fallbackRead, verifiedEmail));
          subscribeRealtime(verifiedUserId);
        }
        // If fallbackRead also fails — leave store untouched. Never setUser(null).
      }
    } catch (err) {
      console.error('Profile load exception — store left untouched:', err);
    } finally {
      isLoadingProfile.current = false;
    }
  };

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) setShowSplash(false);

    // ── ENB DOCTRINE: getSession() unblocks the UI only — never loads profile ──
    // getSession() reads localStorage at T=0ms BEFORE Supabase's _recoverAndRefresh()
    // has attached the JWT to request headers. Any DB call at this point fires with
    // anon key only → auth.uid()=null → RLS fails → 0 rows → phantom INSERT.
    //
    // Fix: call setAuthChecked(true) immediately regardless of session state.
    // The app renders at once. If user=null, AdminLayout/Layout show a spinner.
    // onAuthStateChange(INITIAL_SESSION or SIGNED_IN) fires ~50-200ms later with
    // JWT guaranteed attached → loadUserProfile runs → store populated → UI updates.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setSessionExists(true);
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // ── Never wipe store on Supabase SIGNED_OUT event ────────────────────
      // Supabase fires SIGNED_OUT during tab switching, backgrounding, and
      // internal session rotation — NOT only on explicit logout.
      // Explicit logout is handled by AccountSwitcher.handleLogout and More.tsx
      // logout which call logout() directly before navigating.
      if (event === 'SIGNED_OUT') return;

      // ── USER_UPDATED: ignore — fires on every users table UPDATE ────────
      if (event === 'USER_UPDATED') return;

      if ((event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session?.user) {
        const refreshedId = session.user.id;
        if (!refreshedId) return;

        // ── FIX #2 (cont): Read store state ONCE and capture it ─────────────
        // Root cause of oscillation: useUserStore.getState().user?.id was called
        // inside the handler but the Realtime heartbeat (every 25-30s) could
        // fire this during a React state transition window where .user is briefly
        // undefined — even though the user is fully logged in. This caused
        // loadUserProfile to re-fire on every heartbeat reconnect.
        //
        // Fix: capture the ID into a local variable FIRST, then check.
        // Also: read the ID from the Zustand store's internal state (not React
        // component state) — getState() is always synchronous and never undefined
        // mid-render. This eliminates the race window.
        const storeState   = useUserStore.getState();
        const currentUserId = storeState.user?.id ?? null;

        if (currentUserId && currentUserId === refreshedId) {
          // Same user, token refreshed silently — store is correct, do nothing.
          // This is the normal case after the first load. No loadUserProfile needed.
          return;
        }

        if (!currentUserId) {
          // No user in store yet — genuine first load after session restore.
          // loadUserProfile will call getUser() internally to validate the JWT.
          loadUserProfile(refreshedId, session.user.email ?? '');
          return;
        }

        // Different user in store vs refreshed token — legitimate account switch
        // via AccountSwitcher.handleSwitch → supabase.auth.setSession() → SIGNED_IN.
        // Clean up the previous user's realtime channel before loading the new profile.
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        loadUserProfile(refreshedId, session.user.email ?? '');
      }
    });

    const authTimeout = setTimeout(() => setAuthChecked(true), 4000);

    // ── Cleanup: unsubscribe auth listener, clear timeout, remove realtime channel
    return () => {
      subscription.unsubscribe();
      clearTimeout(authTimeout);
      // FIX #1 cleanup: remove the realtime channel on unmount
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
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
  // ── Session exists but profile not yet in store ───────────────────────────
  // This is the 50-200ms window after authChecked=true where getSession found
  // a valid session but onAuthStateChange hasn't fired loadUserProfile yet.
  // Show a spinner instead of the Welcome page to prevent the flash/redirect loop.
  if (sessionExists && !user) {
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
