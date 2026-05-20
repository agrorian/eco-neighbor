import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useUserStore } from '@/store/user';
import Layout from '@/components/layout/Layout';
import SplashScreen from '@/components/SplashScreen';
import { supabase, supabaseTest, setDbEnvironment } from '@/lib/supabase';
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
import DirectoryHub from '@/pages/directory/DirectoryHub';
import TradesDirectory from '@/pages/directory/TradesDirectory';
import TradesProfile from '@/pages/directory/TradesProfile';
import JobConfirmation from '@/pages/JobConfirmation';
import JobRating from '@/pages/JobRating';
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

// --- Lazily loaded ---
const FounderSale = lazy(() => import('@/pages/FounderSale'));
const FounderHardship = lazy(() => import('@/pages/FounderHardship'));
const PartnerFloat = lazy(() => import('@/pages/PartnerFloat'));
const ModQueue = lazy(() => import('@/pages/admin/ModQueue'));
const ModPerformance = lazy(() => import('@/pages/admin/ModPerformance'));
const ModAssignments = lazy(() => import('@/pages/admin/ModAssignments'));
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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { user, setUser } = useUserStore();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);
  const isLoadingProfile = useRef(false);

  // ── ENB DOCTRINE v2.0.0: rowToUser is the ONLY place DB data becomes store ─
  // environment field added — determines which schema client this user queries
  const rowToUser = (data: any, fallbackEmail: string, env: 'real' | 'test' = 'real') => ({
    id: data.id,
    email: data.email || fallbackEmail,
    full_name: data.full_name || '',
    neighbourhood: data.neighbourhood || '',
    city: data.city || undefined,
    country_code: data.country_code || undefined,
    profession: data.profession || '',
    enb_local_bal: Number(data.enb_local_bal) || 0,
    enb_global_bal: Number(data.enb_global_bal) || 0,
    rep_score: Number(data.rep_score) || 0,
    tier: data.tier || 'Newcomer',
    role: data.role || 'member',
    wallet_address: data.wallet_address || undefined,
    whatsapp_number: data.whatsapp_number || undefined,
    profile_pic_url: data.profile_pic_url || undefined,
    lifetime_earned: Number(data.lifetime_earned) || 0,
    referred_by: data.referred_by || undefined,
    referral_code: data.referral_code || undefined,
    consecutive_absences: Number(data.consecutive_absences) || 0,
    cnic_number: data.cnic_number || undefined,
    cnic_photo_url: data.cnic_photo_url || undefined,
    cnic_verified: data.cnic_verified === true,
    cnic_submitted_at: data.cnic_submitted_at || undefined,
    // ── v1.7.0 carpool ───────────────────────────────────────────────────────
    avg_passenger_rating: Number(data.avg_passenger_rating) || 0,
    total_rides_as_passenger: Number(data.total_rides_as_passenger) || 0,
    is_carpool_rider: data.is_carpool_rider === true,
    avg_carpool_rating: Number(data.avg_carpool_rating) || 0,
    total_carpool_rides: Number(data.total_carpool_rides) || 0,
    // ── v1.8.0 trades ecosystem ───────────────────────────────────────────────
    trade_types: data.trade_types || [],
    total_verified_jobs: Number(data.total_verified_jobs) || 0,
    avg_job_rating: Number(data.avg_job_rating) || 0,
    total_job_ratings: Number(data.total_job_ratings) || 0,
    trade_availability: data.trade_availability || 'not_set',
    trade_availability_until: data.trade_availability_until || undefined,
    trade_availability_schedule: data.trade_availability_schedule || null,
    // ── v2.0.0 environment ───────────────────────────────────────────────────
    environment: (data.environment as 'real' | 'test') || env,
    is_test_account: data.is_test_account === true,
  });

  // ── v2.0.0: Environment-aware profile loader ──────────────────────────────
  // Step 1: Try public schema (Genesis/real environment)
  // Step 2: If no row found → try test schema (Category B test-only users)
  // This handles the shared auth.users reality — test-only users still have
  // auth records but no public.users row after the Genesis wipe.
  const loadUserProfile = async (userId: string, userEmail: string) => {
    if (!userId || userId === 'undefined') return;
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;
    try {
      // ── Try public schema first ───────────────────────────────────────────
      const { data: publicData, error: publicError } = await getDb()
        .from('users').select('*').eq('id', userId).maybeSingle();

      if (publicData) {
        // User exists in Genesis/real environment
        setUser(rowToUser(publicData, userEmail, 'real'));
        setDbEnvironment('real');
        return;
      }

      if (publicError) {
        console.warn('[ENB] Public profile read error:', publicError.message);
      }

      // ── No public.users row — try test schema ─────────────────────────────
      // This user is Category B (test-only) — route them to test environment
      const { data: testData, error: testError } = await supabaseTest
        .from('users').select('*').eq('id', userId).maybeSingle();

      if (testData) {
        // Test-only user — set environment to 'test' so all their queries
        // route to test schema via getDb()
        setUser(rowToUser(testData, userEmail, 'test'));
        setDbEnvironment('test');
        return;
      }

      if (testError) {
        console.warn('[ENB] Test profile read error:', testError.message);
      }

      // ── Neither schema has this user — JWT race, retry with backoff ───────
      console.warn('[ENB] 0 rows in both schemas — JWT race. Retrying...');
      for (const delay of [500, 1500, 3000]) {
        await new Promise(r => setTimeout(r, delay));
        const { data: retryPublic } = await getDb()
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryPublic) { setUser(rowToUser(retryPublic, userEmail, 'real')); setDbEnvironment('real'); return; }

        const { data: retryTest } = await supabaseTest
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryTest) { setUser(rowToUser(retryTest, userEmail, 'test')); setDbEnvironment('test'); return; }
      }
      console.error('[ENB] All retries failed. Store unchanged.');
    } catch (err) {
      console.error('[ENB] Profile load exception — store unchanged:', err);
    } finally {
      isLoadingProfile.current = false;
    }
  };

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) setShowSplash(false);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionExists(true);
        loadUserProfile(session.user.id, session.user.email ?? '').then(() => setAuthChecked(true));
      } else {
        setAuthChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') return;
      if (event === 'USER_UPDATED') return;
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const refreshedId = session.user.id;
        if (!refreshedId) return;
        const currentUserId = useUserStore.getState().user?.id;
        if (currentUserId && currentUserId === refreshedId) return;
        loadUserProfile(refreshedId, session.user.email ?? '');
      }
    });

    const authTimeout = setTimeout(() => setAuthChecked(true), 4000);
    return () => { subscription.unsubscribe(); clearTimeout(authTimeout); };
  }, []);

  // ── ENB DOCTRINE v2.0.0: Global users subscription is environment-aware ──
  // We subscribe to the schema that matches the user's environment.
  // public schema → real users, test schema → test users.
  // Only one subscription at a time — doctrine: zero subscriptions outside App.tsx.
  useEffect(() => {
    if (!user?.id) return;
    const schema = user.environment === 'test' ? 'test' : 'public';
    const client = user.environment === 'test' ? supabaseTest : supabase;

    const channel = client
      .channel(`user-changes-${schema}`)
      .on(
        'postgres_changes',
        { event: '*', schema, table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          // ── ENB DOCTRINE: Functional update — never stale closure ──────────
          setUser(prev => prev ? { ...prev, ...(payload.new as any) } : prev);
        }
      )
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [user?.id, user?.environment]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />;
  if (sessionExists && !user) {
    return (
      <div className="min-h-screen bg-enb-surface flex items-center justify-center flex-col gap-3">
        <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Loading your account...</p>
      </div>
    );
  }
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
    <EnvironmentProvider>
    <Router>
      <div className="font-sans text-enb-text-primary selection:bg-enb-green/20">
        <Routes>
          <Route path="/signup/step1" element={<SignUpStep1 />} />
          <Route path="/signup/step2" element={<SignUpStep2 />} />
          <Route path="/otp-verify" element={<OTPVerification />} />
          <Route path="/about" element={<About />} />
          <Route path="/dev-history" element={<VersionHistory />} />
          <Route path="/account-recovery" element={<AccountRecovery />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/token-disclaimer" element={<TokenDisclaimer />} />

          {/* ── Public routes — no login required ──────────────────────────── */}
          <Route path="/confirm-ride/:token" element={<ConfirmRide />} />
          <Route path="/job/:code" element={<JobConfirmation />} />
          <Route path="/job/:code/rate" element={<JobRating />} />

          {user ? (
            <>
              {/* ── Admin routes ─────────────────────────────────────────── */}
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
                <Route path="mod-performance" element={<ModPerformance />} />
                <Route path="mod-assignments" element={<ModAssignments />} />
              </Route>

              {/* ── Member routes ─────────────────────────────────────────── */}
              <Route path="/*" element={
                <Layout>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/submit" element={<SubmitAction />} />
                      <Route path="/wallet" element={<Wallet />} />

                      {/* Directory — hub + sub-directories */}
                      <Route path="/directory" element={<DirectoryHub />} />
                      <Route path="/directory/business" element={<BusinessDirectory />} />
                      <Route path="/directory/business/:id" element={<BusinessProfile />} />
                      <Route path="/directory/trades" element={<TradesDirectory />} />
                      <Route path="/directory/trades/:userId" element={<TradesProfile />} />
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
    </EnvironmentProvider>
    </LanguageProvider>
  );
}
