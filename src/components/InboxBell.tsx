// src/components/InboxBell.tsx
// Drop this anywhere in your nav/header to show unread count badge
// ENB FIX (v1.9.0): bell now clears when user navigates to /inbox
// by auto-marking all visible messages as read in the shared localStorage key.

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

export default function InboxBell() {
  const { user } = useUserStore();
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  const storageKey = user?.id ? `enb_inbox_read_${user.id}` : null;

  const calcUnread = async () => {
    if (!user?.id || !storageKey) return;

    const { data } = await supabase
      .from('messages')
      .select('id')
      .or(
        `and(message_type.eq.broadcast,target_audience.in.("all","${user.role || 'member'}")),` +
        `and(message_type.eq.mention,recipient_id.eq.${user.id})`
      );

    if (!data) return;

    try {
      const readIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setUnread(data.filter(m => !readIds.includes(m.id)).length);
    } catch {
      setUnread(data.length);
    }
  };

  // Clear badge whenever user navigates to /inbox by marking all messages read
  useEffect(() => {
    if (!user?.id || !storageKey) return;
    if (location.pathname !== '/inbox') return;

    const markAllRead = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id')
        .or(
          `and(message_type.eq.broadcast,target_audience.in.("all","${user.role || 'member'}")),` +
          `and(message_type.eq.mention,recipient_id.eq.${user.id})`
        );

      if (!data?.length) return;

      try {
        const existing: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const allIds = Array.from(new Set([...existing, ...data.map(m => m.id)]));
        localStorage.setItem(storageKey, JSON.stringify(allIds));
        setUnread(0);
      } catch {
        setUnread(0);
      }
    };

    markAllRead();
  }, [location.pathname, user?.id, user?.role, storageKey]);

  // Initial load + realtime
  useEffect(() => {
    if (!user?.id) return;

    calcUnread();

    const channel = supabase
      .channel('inbox-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, () => calcUnread())
      .subscribe();

    return () => getDb().removeChannel(channel);
  }, [user?.id, user?.role]);

  return (
    <Link to="/inbox" className="relative flex items-center justify-center w-10 h-10">
      <Bell className="w-5 h-5 text-enb-text-secondary" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-enb-green
          text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1
          shadow-sm animate-pulse">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
