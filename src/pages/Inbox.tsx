// src/pages/Inbox.tsx
// ENB User Inbox — reads broadcast announcements from Supabase in real-time

import { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, Pin, CheckCheck } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  content: string;
  target_audience: string;
  is_pinned: boolean;
  created_at: string;
  sender_id: string;
  message_type: string;
  channel_id: string | null;
}

const TARGET_LABELS: Record<string, string> = {
  all:          'All Users',
  cfsp:         'CFSP Members',
  mods:         'Moderators',
  food_runners: 'Food Runners',
  cfg:          'CFG Team',
};

const TARGET_COLORS: Record<string, string> = {
  all:          'bg-blue-50 text-blue-700 border-blue-100',
  cfsp:         'bg-green-50 text-green-700 border-green-100',
  mods:         'bg-purple-50 text-purple-700 border-purple-100',
  food_runners: 'bg-orange-50 text-orange-700 border-orange-100',
  cfg:          'bg-teal-50 text-teal-700 border-teal-100',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)   return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-PK', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({ msg, isRead, onRead }: {
  msg: Message;
  isRead: boolean;
  onRead: (id: string) => void;
}) {
  const isMention = msg.message_type === 'mention';
  const target = msg.target_audience || 'all';
  const tagStyle = isMention
    ? 'bg-enb-green/10 text-enb-green border-enb-green/20'
    : TARGET_COLORS[target] || TARGET_COLORS.all;
  const tagLabel = isMention ? '@mention' : (TARGET_LABELS[target] || 'All Users');

  return (
    <div
      onClick={() => onRead(msg.id)}
      className={`bg-white rounded-xl border shadow-sm p-4 transition-all cursor-pointer
        hover:shadow-md hover:border-gray-200 active:scale-[0.99]
        ${!isRead ? 'border-enb-green/40 shadow-enb-green/5' : 'border-gray-100'}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-enb-text-primary flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">ENB</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-enb-text-primary">Eco-Neighbor</p>
              {!isRead && (
                <span className="w-2 h-2 rounded-full bg-enb-green shrink-0" />
              )}
            </div>
            <p className="text-xs text-enb-text-secondary">{timeAgo(msg.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {msg.is_pinned && (
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 font-medium">
              <Pin className="w-2.5 h-2.5" />
              Pinned
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tagStyle}`}>
            {tagLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="text-sm leading-relaxed text-enb-text-primary prose prose-sm max-w-none
          prose-headings:text-enb-text-primary prose-headings:font-semibold
          prose-a:text-enb-green prose-a:no-underline hover:prose-a:underline"
        dangerouslySetInnerHTML={{ __html: msg.content }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Inbox() {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  // ── Load read state from localStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`enb_inbox_read_${user?.id}`);
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {}
  }, [user?.id]);

  const saveReadIds = (ids: Set<string>) => {
    localStorage.setItem(`enb_inbox_read_${user?.id}`, JSON.stringify([...ids]));
  };

  // ── Fetch messages ──────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!user) return;

    // Fetch broadcasts + mention notifications for this user
    const { data, error } = await getDb()
      .from('messages')
      .select('*')
      .or(
        `and(message_type.eq.broadcast,target_audience.in.("all","${user.role || 'member'}")),` +
        `and(message_type.eq.mention,recipient_id.eq.${user.id})`
      )
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) { console.error(error); return; }
    setMessages(data || []);
    setLoading(false);
  }, [user?.id, user?.role]);

  // ── Realtime ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages();

    const channel = getDb()
      .channel('inbox-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: 'message_type=eq.broadcast',
      }, () => fetchMessages())
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `message_type=eq.mention`,
      }, (payload) => {
        // Only refresh if this mention is for the current user
        if (payload.new?.recipient_id === user?.id) fetchMessages();
      })
      .subscribe();

    return () => getDb().removeChannel(channel);
  }, [fetchMessages]);

  // ── Mark as read ────────────────────────────────────────────────────────────
  const markRead = (id: string) => {
    const updated = new Set(readIds).add(id);
    setReadIds(updated);
    saveReadIds(updated);
  };

  const markAllRead = () => {
    const updated = new Set(messages.map(m => m.id));
    setReadIds(updated);
    saveReadIds(updated);
  };

  // ── Filtered messages ───────────────────────────────────────────────────────
  const filtered = messages.filter(m => {
    if (filter === 'unread') return !readIds.has(m.id);
    if (filter === 'pinned') return m.is_pinned;
    return true;
  });

  const unreadCount = messages.filter(m => !readIds.has(m.id)).length;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-24">

      {/* Header */}
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-enb-text-primary">Inbox</h1>
          <p className="text-enb-text-secondary text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-enb-green
              bg-enb-green/10 px-3 py-2 rounded-xl hover:bg-enb-green/20 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'unread', 'pinned'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize
              ${filter === tab
                ? 'bg-enb-text-primary text-white shadow-sm'
                : 'bg-white border border-gray-100 text-enb-text-secondary hover:bg-gray-50'
              }`}
          >
            {tab}
            {tab === 'unread' && unreadCount > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold
                ${filter === 'unread' ? 'bg-white/20 text-white' : 'bg-enb-green text-white'}`}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded w-32" />
                  <div className="h-3 bg-gray-100 rounded w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-3/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          {filter === 'unread' ? (
            <>
              <CheckCheck className="w-10 h-10 text-enb-green mx-auto mb-3" />
              <p className="font-semibold text-enb-text-primary">All caught up!</p>
              <p className="text-sm text-enb-text-secondary mt-1">No unread messages.</p>
            </>
          ) : filter === 'pinned' ? (
            <>
              <Pin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-enb-text-primary">No pinned messages</p>
              <p className="text-sm text-enb-text-secondary mt-1">Pinned announcements will appear here.</p>
            </>
          ) : (
            <>
              <BellOff className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-semibold text-enb-text-primary">No announcements yet</p>
              <p className="text-sm text-enb-text-secondary mt-1">Check back soon for updates from ENB.</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((msg, i) => {
            const showDateDivider = i === 0 || !isSameDay(msg.created_at, filtered[i - 1].created_at);
            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center gap-3 my-1">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-enb-text-secondary font-medium shrink-0">
                      {formatDate(msg.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                )}
                <MessageCard
                  msg={msg}
                  isRead={readIds.has(msg.id)}
                  onRead={markRead}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
