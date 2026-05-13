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

// --- Lazily loaded ---
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

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { user, setUser } = useUserStore();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  // Race guard: prevents getSession() and onAuthStateChange from both
  // calling loadUserProfile simultaneously on hard refresh.
  const isLoadingProfile = useRef(false);

  const rowToUser = (data: any, fallbackEmail: string) => ({
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
  });

  const subscribeRealtime = (userId: string) => {
    supabase
      .channel(`global-user-sync-${userId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'users',
        filter: `id=eq.${userId}`,
      }, (payload) => {
        if (payload.new?.id) {
          // Strip null/undefined values from payload.new before merging.
          // With DEFAULT replica identity, unchanged columns come back as null
          // and would overwrite correct store values (e.g. full_name → null → U).
          // With FULL replica identity this is less critical but still safer.
          const safePayload = Object.fromEntries(
            Object.entries(payload.new).filter(([, v]) => v !== null && v !== undefined)
          );
          setUser((prev: any) => prev ? { ...prev, ...safePayload } : prev);
        }
      })
      .subscribe();
  };

  const loadUserProfile = async (userId: string, userEmail: string) => {
    if (!userId || userId === 'undefined') return;
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;
    try {
      // FIX 1: Use maybeSingle() not single().
      // .single() throws PGRST116 on 0 rows, which the original code treated as
      // "new user" and ran INSERT with full_name:''. That created the blank row
      // that showed as phantom U.
      // .maybeSingle() returns {data:null, error:null} on 0 rows — distinguishable
      // from a real error {data:null, error:non-null}.
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).maybeSingle();

      if (data) {
        setUser(rowToUser(data, userEmail));
        subscribeRealtime(data.id);
        return;
      }

      if (error) {
        // RLS or network error — JWT may not be attached yet.
        // FIX 2: NEVER setUser(null) on error. Leave store untouched and retry.
        console.warn('[ENB] Profile read error, retrying in 800ms:', error.message);
        await new Promise(r => setTimeout(r, 800));
        const { data: retryData } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryData) {
          setUser(rowToUser(retryData, userEmail));
          subscribeRealtime(retryData.id);
        }
        // Retry failed: leave store untouched. Next TOKEN_REFRESHED will retry.
        return;
      }

      // data===null AND error===null: JWT race — request fired before auth headers
      // attached, RLS saw anonymous user, returned 0 rows silently.
      // FIX 3: NEVER INSERT here. The row exists — we just can't read it yet.
      // Retry with backoff until JWT settles.
      console.warn('[ENB] 0 rows — JWT race. Retrying with backoff...');
      for (const delay of [500, 1500, 3000]) {
        await new Promise(r => setTimeout(r, delay));
        const { data: retryData } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryData) {
          setUser(rowToUser(retryData, userEmail));
          subscribeRealtime(retryData.id);
          return;
        }
      }
      // All retries failed. Store left untouched. Never INSERT, never setUser(null).
      console.error('[ENB] All retries failed. Store unchanged.');

    } catch (err) {
      // FIX 4: NEVER setUser(null) in catch. Leave store untouched.
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
        loadUserProfile(session.user.id, session.user.email ?? '').then(() => setAuthChecked(true));
      } else {
        setAuthChecked(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // FIX 5: Handle SIGNED_IN and TOKEN_REFRESHED — not just SIGNED_OUT.
      // Original code only handled SIGNED_OUT, so token refreshes and account
      // switches never recovered a blank store.

      // SIGNED_OUT: ignore Supabase-fired events (tab switch, rotation).
      // Explicit logout is handled by AccountSwitcher/More.tsx via logout() directly.
      if (event === 'SIGNED_OUT') return;
      // USER_UPDATED fires on every users table UPDATE — ignore to prevent loops.
      if (event === 'USER_UPDATED') return;

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const refreshedId = session.user.id;
        if (!refreshedId) return;
        const currentUserId = useUserStore.getState().user?.id;
        // Same user, token silently refreshed — store is correct, do nothing.
        if (currentUserId && currentUserId === refreshedId) return;
        // No user in store, or different user (account switch) — load profile.
        loadUserProfile(refreshedId, session.user.email ?? '');
      }
    });

    const authTimeout = setTimeout(() => setAuthChecked(true), 4000);
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
