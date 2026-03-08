/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user';
import Layout from '@/components/layout/Layout';
import SplashScreen from '@/components/SplashScreen';
import { supabase } from '@/lib/supabase';

// Pages
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
import Profile from '@/pages/Profile';
import MaturationBridge from '@/pages/wallet/MaturationBridge';
import GenerateRedemptionQR from '@/pages/wallet/GenerateRedemptionQR';
import ReferralHub from '@/pages/wallet/ReferralHub';
import Settings from '@/pages/Settings';
import More from '@/pages/More';

// Admin Pages
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SubmissionQueue from '@/pages/admin/SubmissionQueue';
import UserManagement from '@/pages/admin/UserManagement';
import CampaignManager from '@/pages/admin/CampaignManager';
import PartnerManager from '@/pages/admin/PartnerManager';
import BridgeManager from '@/pages/admin/BridgeManager';

// Onboarding Pages
import Welcome from '@/pages/onboarding/Welcome';
import SignUpStep1 from '@/pages/onboarding/SignUpStep1';
import SignUpStep2 from '@/pages/onboarding/SignUpStep2';
import ConnectWallet from '@/pages/onboarding/ConnectWallet';
import Tutorial from '@/pages/onboarding/Tutorial';
import Login from '@/pages/onboarding/Login';

export default function App() {
  const { user, setUser } = useUserStore();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Check if splash has been shown this session
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    }

    // Check current Supabase session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          full_name: '',
          neighbourhood: '',
          profession: '',
          enb_local_bal: 0,
          rep_score: 0,
          tier: 'Newcomer',
          role: 'member'
        });
      }
      setAuthChecked(true);
    }).catch(() => {
      setAuthChecked(true);
    });

    // Listen for auth changes (magic link clicks, logouts)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: '',
            neighbourhood: '',
            profession: '',
            enb_local_bal: 0,
            rep_score: 0,
            tier: 'Newcomer',
            role: 'member'
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-enb-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-enb-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="font-sans text-enb-text-primary selection:bg-enb-green/20">
        <Routes>
          {user ? (
            <>
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="queue" element={<SubmissionQueue />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="campaigns" element={<CampaignManager />} />
                <Route path="partners" element={<PartnerManager />} />
                <Route path="bridge" element={<BridgeManager />} />
              </Route>

              {/* Main App Routes */}
              <Route path="/*" element={
                <Layout>
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
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/bridge" element={<MaturationBridge />} />
                    <Route path="/wallet/redeem" element={<GenerateRedemptionQR />} />
                    <Route path="/wallet/referrals" element={<ReferralHub />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/more" element={<More />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              } />
            </>
          ) : (
            <>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup/step1" element={<SignUpStep1 />} />
              <Route path="/signup/step2" element={<SignUpStep2 />} />
              <Route path="/onboarding/wallet" element={<ConnectWallet />} />
              <Route path="/onboarding/tutorial" element={<Tutorial />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </div>
    </Router>
  );
}