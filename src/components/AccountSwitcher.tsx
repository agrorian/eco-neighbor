import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import { LogOut, Plus, Check, ChevronUp, ShieldCheck, Shield, User } from 'lucide-react';

interface SavedAccount {
  email: string;
  full_name: string;
  role: string;
  access_token: string;
  refresh_token: string;
  avatar_initial: string;
}

const STORAGE_KEY = 'enb_saved_accounts';

function getSavedAccounts(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAccount(account: SavedAccount) {
  const accounts = getSavedAccounts();
  const existing = accounts.findIndex(a => a.email === account.email);
  // Always recompute avatar_initial from fresh name
  const fresh = { ...account, avatar_initial: (account.full_name || account.email || 'U').charAt(0).toUpperCase() };
  if (existing >= 0) {
    accounts[existing] = fresh;
  } else {
    accounts.push(fresh);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function removeAccount(email: string) {
  const accounts = getSavedAccounts().filter(a => a.email !== email);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Call this after every successful login to save the session
export function saveCurrentSession(user: any, session: any) {
  if (!session || !user) return;
  saveAccount({
    email: user.email || '',
    full_name: user.full_name || user.email || '',
    role: user.role || 'member',
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    avatar_initial: (user.full_name || user.email || 'U').charAt(0).toUpperCase(),
  });
}

interface AccountSwitcherProps {
  compact?: boolean; // true = mobile (just avatar), false = desktop (full row)
}

export default function AccountSwitcher({ compact = false }: AccountSwitcherProps) {
  const { user, setUser, logout } = useUserStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAccounts(getSavedAccounts());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Save current session whenever it changes
  useEffect(() => {
    if (!user) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) saveCurrentSession(user, data.session);
    });
  }, [user?.id]);

  const handleSwitch = async (account: SavedAccount) => {
    if (account.email === user?.email) { setOpen(false); return; }
    setSwitching(account.email);
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: account.access_token,
        refresh_token: account.refresh_token,
      });

      if (error || !data.session) {
        // Token expired — remove and show message
        removeAccount(account.email);
        setAccounts(getSavedAccounts());
        setSwitching(null);
        alert(`Session expired for ${account.email}. Please log in again.`);
        return;
      }

      // Fetch user profile for the switched account
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      if (profile) {
        setUser({
          id: data.session.user.id,
          email: data.session.user.email || '',
          full_name: profile.full_name,
          neighbourhood: profile.neighbourhood,
          profession: profile.profession,
          enb_local_bal: profile.enb_local_bal || 0,
          enb_global_bal: profile.enb_global_bal || 0,
          rep_score: profile.rep_score || 0,
          tier: profile.tier || 'Newcomer',
          role: profile.role || 'member',
          wallet_address: profile.wallet_address,
          whatsapp_number: profile.whatsapp_number,
          lifetime_earned: profile.lifetime_earned || 0,
          referral_code: profile.referral_code,
          consecutive_absences: profile.consecutive_absences || 0,
          is_active: profile.is_active,
        });
        // Update saved account with fresh tokens
        saveAccount({
          ...account,
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          role: profile.role || 'member',
          full_name: profile.full_name || account.email,
        });
      }

      setOpen(false);
      navigate('/');
    } catch {
      setSwitching(null);
    }
    setSwitching(null);
  };

  const handleLogout = async () => {
    removeAccount(user?.email || '');
    await supabase.auth.signOut();
    logout();
    window.location.href = '/';
  };

  const handleAddAccount = () => {
    setOpen(false);
    // Sign out current user and go to login — current session saved
    supabase.auth.signOut().then(() => {
      logout();
      navigate('/login?add_account=true');
    });
  };

  const otherAccounts = accounts.filter(a => a.email !== user?.email);

  const getRoleIcon = (role: string) => {
    if (role === 'admin') return <ShieldCheck className="w-3 h-3 text-enb-green" />;
    if (role === 'moderator') return <Shield className="w-3 h-3 text-blue-500" />;
    return <User className="w-3 h-3 text-gray-400" />;
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      {/* Trigger — current user row */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors group ${compact ? 'justify-center' : ''}`}
      >
        <div className="w-8 h-8 rounded-full bg-enb-green/10 flex items-center justify-center text-enb-green font-bold text-sm flex-shrink-0">
          {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
        </div>
        {!compact && (
          <>
            <div className="flex-1 overflow-hidden text-left">
              <div className="text-sm font-bold text-gray-900 truncate">{user.full_name || user.email}</div>
              <div className="text-xs text-gray-500 truncate capitalize flex items-center gap-1">
                {getRoleIcon(user.role || 'member')}
                {user.role}
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className={`absolute ${compact ? 'right-0 bottom-12' : 'bottom-full left-0 right-0 mb-1'} bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden`}
          style={{ minWidth: compact ? '220px' : undefined, maxWidth: compact ? 'calc(100vw - 16px)' : undefined }}>

          {/* Current account */}
          <div className="px-3 py-2 bg-enb-green/5 border-b border-gray-100">
            <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Current Account</div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-enb-green/20 flex items-center justify-center text-enb-green font-bold text-xs">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold text-gray-900 truncate">{user.full_name || user.email}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
              <Check className="w-4 h-4 text-enb-green flex-shrink-0" />
            </div>
          </div>

          {/* Other saved accounts */}
          {otherAccounts.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">Switch to</div>
              {otherAccounts.map(account => (
                <button
                  key={account.email}
                  onClick={() => handleSwitch(account)}
                  disabled={switching === account.email}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs flex-shrink-0">
                    {(account.full_name || account.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden text-left">
                    <div className="text-sm font-medium text-gray-900 truncate">{account.full_name || account.email}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      {getRoleIcon(account.role)}
                      <span className="capitalize">{account.role}</span>
                    </div>
                  </div>
                  {switching === account.email && (
                    <div className="w-4 h-4 border-2 border-enb-green border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={handleAddAccount}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-enb-green hover:bg-enb-green/5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add account
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
