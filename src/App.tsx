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

  // ── ENB DOCTRINE: Race guard — prevent double loadUserProfile calls ───────
  // getSession() and onAuthStateChange(SIGNED_IN) both fire on hard refresh.
  // Without this guard the second call hits the DB before the store is populated,
  // sees user=null in store, passes the guard, and triggers the phantom INSERT.
  // useRef keeps the flag stable across re-renders without causing re-renders.
  const isLoadingProfile = useRef(false);

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

  const loadUserProfile = async (userId: string, userEmail: string) => {
    // ── Hard guard — never load with undefined/empty userId ───────────────
    if (!userId || userId === 'undefined') return;
    // ── Race guard — only one profile load in flight at a time ──────────────
    // Prevents getSession() and onAuthStateChange(SIGNED_IN) from both firing
    // loadUserProfile simultaneously on hard refresh, which caused the phantom.
    if (isLoadingProfile.current) return;
    isLoadingProfile.current = true;
    try {
      // ── Attempt 1: read the existing profile row ──────────────────────────
      // maybeSingle(): {data, error:null} on success, {null, error} on RLS/network,
      // {null, null} on genuine 0 rows. Never use .single() — it can't distinguish
      // RLS block from missing row, which caused phantom INSERTs.
      const { data, error } = await supabase
        .from('users').select('*').eq('id', userId).maybeSingle();

      if (data) {
        // ── Happy path: row found, populate store ─────────────────────────
        setUser(rowToUser(data, userEmail));

        // ── ENB DOCTRINE: One global realtime subscription, set up once ───
        if (data.id) {
          supabase
            .channel(`global-user-sync-${data.id}`)
            .on('postgres_changes', {
              event: 'UPDATE', schema: 'public', table: 'users',
              filter: `id=eq.${data.id}`,
            }, (payload) => {
              // functional update preserves all store fields not in payload
              if (payload.new && payload.new.id) {
                setUser((prev: any) => prev ? { ...prev, ...payload.new } : prev);
              }
            })
            .subscribe();
        }
        return; // done — never fall through
      }

      if (error) {
        // ── RLS or network blocked the read — JWT not ready yet ──────────
        // This happens on hard refresh when getSession() fires before the
        // Supabase client has fully initialised auth headers.
        // NEVER INSERT on error — the row exists, we just can't read it yet.
        // NEVER setUser(null) — that wipes the store and causes the phantom flicker.
        // Retry once after a short delay to let the JWT settle.
        console.warn('Profile read blocked (RLS/network) — retrying in 800ms.', error.message);
        await new Promise(r => setTimeout(r, 800));
        const { data: retryData } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (retryData) {
          setUser(rowToUser(retryData, userEmail));
          if (retryData.id) {
            supabase
              .channel(`global-user-sync-${retryData.id}`)
              .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'users',
                filter: `id=eq.${retryData.id}`,
              }, (payload) => {
                if (payload.new && payload.new.id) {
                  setUser((prev: any) => prev ? { ...prev, ...payload.new } : prev);
                }
              })
              .subscribe();
          }
        } else {
          // Retry also failed — do NOT wipe the store. Leave it as-is and
          // let onAuthStateChange handle recovery when the token refreshes.
          console.error('Profile retry also failed. Leaving store untouched — will recover on next token refresh.');
        }
        return;
      }

      // ── data===null, error===null: genuine new user — safe to INSERT ──────
      // This path ONLY runs when there is truly no row for this userId.
      // It will never run for Muhammad Faisal whose row exists in public.users.
      console.warn('No profile row found for userId:', userId, '— creating new member row.');
      const { data: insertedRow, error: insertError } = await supabase
        .from('users').insert({
          id: userId, email: userEmail, full_name: '',
          enb_local_bal: 0, enb_global_bal: 0, rep_score: 0,
          tier: 'Newcomer', role: 'member', is_active: true,
        }).select().single();

      if (insertedRow) {
        setUser(rowToUser(insertedRow, userEmail));
      } else if (insertError) {
        // INSERT failed — most likely a duplicate key, meaning the row DOES exist
        // but RLS blocked the read AND the insert. Retry the read.
        console.warn('INSERT failed (likely duplicate) — retrying read.', insertError.message);
        await new Promise(r => setTimeout(r, 500));
        const { data: fallbackRead } = await supabase
          .from('users').select('*').eq('id', userId).maybeSingle();
        if (fallbackRead) {
          setUser(rowToUser(fallbackRead, userEmail));
        }
        // If fallbackRead also fails — leave store untouched. Never setUser(null).
      }
    } catch (err) {
      // ── NEVER setUser(null) in catch ─────────────────────────────────────
      // Wiping the store causes the phantom flicker. If the profile load fails,
      // the store retains whatever it had (possibly null on first load — that's
      // fine, the user sees a loading state, not a phantom account).
      console.error('Profile load exception — store left untouched:', err);
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
      if (event === 'SIGNED_OUT') {
        // ── Guard against Supabase internal session rotation ─────────────
        // USER_UPDATED (from last_seen PATCH) causes Supabase to rotate the
        // session internally, briefly firing SIGNED_OUT then SIGNED_IN.
        // Only wipe the store if there is genuinely no session recoverable.
        // Wait 1 second to see if a SIGNED_IN follows immediately.
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              // Genuinely signed out — no session recoverable
              setUser(null);
            }
            // If session exists, Supabase rotated internally — keep store intact
          });
        }, 1000);
        return;
      }
      // Handle token refresh and sign-in events
      // ── ENB DOCTRINE: Always verify the refreshed session matches current user ─
      // ── USER_UPDATED fires every time sync_user_role_to_auth trigger runs ──
      // That trigger fires on EVERY users table UPDATE (including last_seen).
      // Supabase JS auto-updates the local session with auth user data on this event.
      // We must ignore it — the store is already correct from loadUserProfile.
      if (event === 'USER_UPDATED') return;

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

        // Different user in store vs refreshed token.
        // This is a LEGITIMATE account switch via AccountSwitcher.handleSwitch,
        // which calls supabase.auth.setSession() — that fires SIGNED_IN with the
        // new user's ID. We must load the new profile, not sign out.
        // The old "sign out on mismatch" logic was too aggressive — it treated
        // every legitimate account switch as a phantom account attack.
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