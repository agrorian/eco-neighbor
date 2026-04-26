// src/components/InboxBell.tsx
// Drop this anywhere in your nav/header to show unread count badge

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

export default function InboxBell() {
  const { user } = useUserStore();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;

    const calcUnread = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id')
        .eq('message_type', 'broadcast')
        .in('target_audience', ['all', user.role || 'member']);

      if (!data) return;

      try {
        const readIds: string[] = JSON.parse(
          localStorage.getItem(`enb_inbox_read_${user.id}`) || '[]'
        );
        setUnread(data.filter(m => !readIds.includes(m.id)).length);
      } catch {
        setUnread(data.length);
      }
    };

    calcUnread();

    const channel = supabase
      .channel('inbox-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'message_type=eq.broadcast',
      }, () => calcUnread())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

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
