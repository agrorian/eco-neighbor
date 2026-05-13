import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useState, useEffect, Suspense, lazy } from 'react';
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

  // ── ENB DOCTRINE: Race guard — prevent double loadUserProfile calls ───────
  // getSession() and onAuthStateChange(SIGNED_IN) both fire on hard refresh.
  // Without this guard the second call hits the DB before the store is populated,
  // sees user=null in store, passes the guard, and triggers the phantom INSERT.
  // useRef keeps the flag stable across re-renders without causing re-renders.
  const isLoadingProfile = useState({ current: false })[0];

  const loadUserProfile = async (userId: string, userEmail: string) => {
    // ── ENB DOCTRINE: Hard guard — never load with undefined/empty userId ─
    if (!userId || userId === 'undefined') return;
    // ── Race guard — only one profile load in flight at a time ──────────────
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;
    try {
      // ── maybeSingle() not single() ────────────────────────────────────────
      // .single() treats 0 rows as PGRST116 error — identical to an RLS block.
      // .maybeSingle() returns {data:null, error:null} for genuine 0 rows, and
      // {data:null, error:<msg>} for RLS/network failures.
      // CRITICAL RULE: never INSERT when error is set — that means RLS blocked
      // the read, NOT that the row is missing. Inserting on RLS block creates
      // the phantom blank account seen in AccountSwitcher.
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setUser({
          id: data.id,
          email: data.email || userEmail,
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

        // ── ENB DOCTRINE: Global realtime sync ────────────────────────────────
        // One subscription here keeps the entire app in sync.
        // Every component reads from the store — none need their own user subscriptions.
        // Guard: never subscribe with undefined id — causes cascade 400 errors
        if (data.id) {
          supabase
            .channel(`global-user-sync-${data.id}`)
            .on('postgres_changes', {
              event: 'UPDATE', schema: 'public', table: 'users',
              filter: `id=eq.${data.id}`,
            }, (payload) => {
              if (payload.new && payload.new.id) {
                setUser((prev: any) => prev ? { ...prev, ...payload.new } : prev);
              }
            })
            .subscribe();
        }
      } else {
        // ── NEVER INSERT on error — that means RLS blocked the read ──────────
        // Only insert when data===null AND error===null (genuine 0 rows = new user).
        // If error is set, the row exists but JWT/RLS blocked the read.
        // Inserting here is what creates the phantom blank account.
        if (error) {
          console.error('Profile read blocked — RLS or network error. JWT may be stale. User must re-login.', error.message);
          setUser(null);
          return;
        }

        // data===null, error===null: genuine new user — safe to insert
        console.warn('No profile row found for userId:', userId, '— inserting new row.');
        const { data: insertedRow } = await supabase.from('users').insert({
          id: userId, email: userEmail, full_name: '',
          enb_local_bal: 0, enb_global_bal: 0, rep_score: 0,
          tier: 'Newcomer', role: 'member', is_active: true,
        }).select().single();

        // If insert succeeded, use the new row. If it failed (row already exists,
        // RLS blocked), retry the read — the JWT may have refreshed.
        if (insertedRow) {
          setUser({
            id: insertedRow.id, email: insertedRow.email || userEmail,
            full_name: insertedRow.full_name || '',
            neighbourhood: insertedRow.neighbourhood || '',
            profession: insertedRow.profession || '',
            enb_local_bal: Number(insertedRow.enb_local_bal) || 0,
            enb_global_bal: Number(insertedRow.enb_global_bal) || 0,
            rep_score: Number(insertedRow.rep_score) || 0,
            tier: insertedRow.tier || 'Newcomer',
            role: insertedRow.role || 'member',
            lifetime_earned: Number(insertedRow.lifetime_earned) || 0,
            referral_code: insertedRow.referral_code || undefined,
          });
        } else {
          // Row exists but RLS blocked both the read and the insert.
          // Do NOT set zeros — show an auth error state instead.
          console.error('Profile load blocked by RLS. JWT role may be stale. User must re-login.');
          setUser(null);
        }
      }
    } catch (err) {
      // Catch block: never set zeros on an existing user.
      // If we cannot read the profile, the safest action is null (triggers re-login).
      console.error('Profile load exception:', err);
      setUser(null);
    } finally {
      // ── Always release the race guard so future genuine re-logins work ────
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
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      // Handle token refresh and sign-in events
      // ── ENB DOCTRINE: Always verify the refreshed session matches current user ─
      if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session?.user) {
        const refreshedId = session.user.id;
        if (!refreshedId) return;
        const currentUserId = useUserStore.getState().user?.id;

        // ── ENB DOCTRINE: Never reload profile on token events for same user ──
        // TOKEN_REFRESHED and SIGNED_IN both fire on Supabase internal refresh.
        // If the refreshed ID matches current user (or current user not yet loaded
        // but refreshed ID matches the session) — skip loadUserProfile entirely.
        // loadUserProfile is only safe to call on genuine fresh logins.
        if (currentUserId && currentUserId === refreshedId) {
          // Same user — token refreshed silently, store is correct, do nothing
          return;
        }

        if (!currentUserId) {
          // No user in store yet — this is a genuine page load after session restore
          // Safe to load profile
          loadUserProfile(refreshedId, session.user.email ?? '');
          return;
        }

        // Different user in store vs refreshed token — phantom account prevention
        console.warn('Session mismatch detected. Signing out to prevent phantom account.');
        await supabase.auth.signOut();
        setUser(null);
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