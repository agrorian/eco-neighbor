// src/pages/channels/ChannelView.tsx
// Channel chat panel — L6 Pinned Announcements · L7 Notifications · Reactions

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hash, Users, Megaphone, Lock, ArrowLeft, Info,
  Pin, SmilePlus, X, Bell, BellOff,
} from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';
import ChannelInfoPanel from './ChannelInfoPanel';
import RichTextEditor from '@/components/RichTextEditor';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Channel {
  id: string;
  name: string;
  description: string | null;
  posting_mode: string;
  type: string;
  member_count: number;
  created_by: string;
  dept_id: string | null;
  region_id: string | null;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean; // did current user react with this emoji?
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_pinned?: boolean;
  pinned_by?: string | null;
  pinned_at?: string | null;
  sender?: { full_name: string; profile_pic_url: string | null; role: string };
  reactions?: Reaction[];
}

interface ChannelMember {
  user_id: string;
  role: string;
}

// ── Quick emoji set ───────────────────────────────────────────────────────────
const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '🙏', '🔥', '✅', '👀'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
}

function formatDateDivider(ts: string): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long' });
}

function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function Avatar({ name, url, size = 'sm' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return url ? (
    <img src={url} alt={name} className={`${sz} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${sz} rounded-full bg-enb-green/20 flex items-center justify-center font-semibold text-enb-green shrink-0`}>
      {initials}
    </div>
  );
}

// ── Reaction Bar ──────────────────────────────────────────────────────────────

function ReactionBar({ reactions, onToggle }: {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
}) {
  if (!reactions?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map(r => (
        <button
          key={r.emoji}
          onClick={() => onToggle(r.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all
            ${r.reacted
              ? 'bg-enb-green/10 border-enb-green/30 text-enb-green font-semibold'
              : 'bg-white border-gray-200 text-enb-text-secondary hover:border-enb-green/30'
            }`}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

// ── Emoji Picker ──────────────────────────────────────────────────────────────

function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  return (
    <div className="absolute bottom-full mb-1 right-0 z-30 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 flex gap-1">
      {QUICK_EMOJIS.map(e => (
        <button
          key={e}
          onClick={() => { onSelect(e); onClose(); }}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-base transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

// ── Pinned Banner ─────────────────────────────────────────────────────────────

function PinnedBanner({ msg, onDismiss, canUnpin, onUnpin }: {
  msg: Message;
  onDismiss: () => void;
  canUnpin: boolean;
  onUnpin: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-enb-gold/10 border-b border-enb-gold/20 shrink-0">
      <Pin className="w-3.5 h-3.5 text-enb-gold-dark shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold text-enb-gold-dark uppercase tracking-wide">Pinned</span>
        <p
          className="text-xs text-enb-text-primary truncate"
          dangerouslySetInnerHTML={{ __html: msg.content.replace(/<[^>]+>/g, ' ').trim() }}
        />
      </div>
      {canUnpin && (
        <button
          onClick={onUnpin}
          className="text-[10px] text-enb-text-muted hover:text-red-500 font-medium transition-colors shrink-0"
        >
          Unpin
        </button>
      )}
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg, isMine, showAvatar, isAdmin, onReact, onPin, onUnpin, canPin }: {
  msg: Message;
  isMine: boolean;
  showAvatar: boolean;
  isAdmin: boolean;
  canPin: boolean;
  onReact: (msgId: string, emoji: string) => void;
  onPin: (msgId: string) => void;
  onUnpin: (msgId: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  return (
    <div
      className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmoji(false); }}
    >
      {/* Avatar */}
      <div className="w-7 shrink-0">
        {showAvatar && !isMine && (
          <Avatar name={msg.sender?.full_name || '?'} url={msg.sender?.profile_pic_url} />
        )}
      </div>

      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && !isMine && (
          <span className="text-xs font-semibold text-enb-text-secondary mb-1 px-1">
            {msg.sender?.full_name}
          </span>
        )}

        {/* Pin indicator on message */}
        {msg.is_pinned && (
          <div className={`flex items-center gap-1 mb-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
            <Pin className="w-2.5 h-2.5 text-enb-gold-dark" />
            <span className="text-[9px] text-enb-gold-dark font-semibold uppercase tracking-wide">Pinned</span>
          </div>
        )}

        <div className="relative">
          {/* Bubble */}
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
            ${msg.is_pinned
              ? isMine
                ? 'bg-enb-green text-white rounded-br-sm ring-2 ring-enb-gold/40'
                : 'bg-white border border-enb-gold/30 text-enb-text-primary rounded-bl-sm shadow-sm ring-1 ring-enb-gold/20'
              : isMine
                ? 'bg-enb-green text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-enb-text-primary rounded-bl-sm shadow-sm'
            }`}>
            <div
              className="prose prose-sm max-w-none
                prose-headings:font-semibold prose-headings:my-0.5
                prose-p:my-0 prose-li:my-0
                prose-a:no-underline hover:prose-a:underline
                prose-code:px-1 prose-code:rounded prose-code:text-[0.8em]
                prose-blockquote:my-1 prose-blockquote:pl-2 prose-blockquote:border-l-2
                prose-hr:my-1"
              style={isMine ? { color: 'white' } : {}}
              dangerouslySetInnerHTML={{ __html: msg.content }}
            />
            <p className={`text-[10px] mt-1 ${isMine ? 'text-white/70 text-right' : 'text-enb-text-secondary'}`}>
              {formatTime(msg.created_at)}
            </p>
          </div>

          {/* Action buttons — appear on hover */}
          {showActions && (
            <div className={`absolute top-1 ${isMine ? 'left-0 -translate-x-full pr-1' : 'right-0 translate-x-full pl-1'} flex items-center gap-0.5`}>
              {/* Emoji picker trigger */}
              <div className="relative">
                <button
                  onClick={() => setShowEmoji(p => !p)}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:border-enb-green/40 shadow-sm transition-colors"
                >
                  <SmilePlus className="w-3.5 h-3.5 text-gray-400" />
                </button>
                {showEmoji && (
                  <EmojiPicker
                    onSelect={(emoji) => onReact(msg.id, emoji)}
                    onClose={() => setShowEmoji(false)}
                  />
                )}
              </div>

              {/* Pin/Unpin — admin only */}
              {canPin && (
                <button
                  onClick={() => msg.is_pinned ? onUnpin(msg.id) : onPin(msg.id)}
                  title={msg.is_pinned ? 'Unpin message' : 'Pin message'}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center shadow-sm transition-colors
                    ${msg.is_pinned
                      ? 'bg-enb-gold/10 border-enb-gold/30 hover:bg-enb-gold/20'
                      : 'bg-white border-gray-200 hover:border-enb-gold/40'
                    }`}
                >
                  <Pin className={`w-3 h-3 ${msg.is_pinned ? 'text-enb-gold-dark' : 'text-gray-400'}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reactions */}
        <ReactionBar
          reactions={msg.reactions || []}
          onToggle={(emoji) => onReact(msg.id, emoji)}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ChannelViewProps {
  channel: Channel;
  onBack: () => void;
}

export default function ChannelView({ channel, onBack }: ChannelViewProps) {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [membership, setMembership] = useState<ChannelMember | null>(null);
  const [memberCount, setMemberCount] = useState(channel.member_count || 0);
  const [showInfo, setShowInfo] = useState(false);
  const [channelData, setChannelData] = useState(channel);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [showPinnedBanner, setShowPinnedBanner] = useState(true);
  const [muted, setMuted] = useState(false); // L7: mute channel notifications
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync on channel switch
  useEffect(() => {
    setChannelData(channel);
    setMessages([]);
    setMembership(null);
    setMemberCount(channel.member_count || 0);
    setShowInfo(false);
    setShowPinnedBanner(true);
    setPinnedMsg(null);
  }, [channel.id]);

  // ── Role helpers ─────────────────────────────────────────────────────────
  // ── ENB DOCTRINE: Always use shared isSuperAdmin() from store ────────────
  const isSuperAdmin = checkSuperAdmin(user?.role);
  const isChannelAdmin = membership?.role === 'admin' || isSuperAdmin;
  const canPin = isChannelAdmin;
  const canPost = channelData.posting_mode === 'open'
    ? !!membership
    : channelData.posting_mode === 'admin_only'
      ? isChannelAdmin
      : !!membership;
  const isMember = !!membership;

  // ── Fetch reactions for a batch of messages ───────────────────────────────
  const attachReactions = useCallback(async (msgs: Message[]): Promise<Message[]> => {
    if (!msgs.length || !user) return msgs;
    const ids = msgs.map(m => m.id);

    const { data } = await supabase
      .from('message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', ids);

    if (!data?.length) return msgs;

    // Group reactions per message
    const map = new Map<string, { emoji: string; users: string[] }[]>();
    data.forEach(r => {
      if (!map.has(r.message_id)) map.set(r.message_id, []);
      const list = map.get(r.message_id)!;
      const existing = list.find(e => e.emoji === r.emoji);
      if (existing) existing.users.push(r.user_id);
      else list.push({ emoji: r.emoji, users: [r.user_id] });
    });

    return msgs.map(m => ({
      ...m,
      reactions: (map.get(m.id) || []).map(r => ({
        emoji: r.emoji,
        count: r.users.length,
        reacted: r.users.includes(user.id),
      })),
    }));
  }, [user?.id]);

  // ── Fetch messages ────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, is_pinned, pinned_by, pinned_at')
      .eq('message_type', 'channel')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data?.length) { setMessages([]); setPinnedMsg(null); return; }

    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name, profile_pic_url, role')
      .in('id', senderIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const withSenders = data.map(m => ({
      ...m,
      sender: profileMap.get(m.sender_id),
    }));

    const withReactions = await attachReactions(withSenders);
    setMessages(withReactions);

    // Update pinned message (most recently pinned)
    const pinned = withReactions.filter(m => m.is_pinned)
      .sort((a, b) => new Date(b.pinned_at || 0).getTime() - new Date(a.pinned_at || 0).getTime())[0];
    setPinnedMsg(pinned || null);
    if (pinned) setShowPinnedBanner(true);
  }, [channel.id, attachReactions]);

  // ── Membership + initial load ─────────────────────────────────────────────
  useEffect(() => {
    const checkMembership = async () => {
      if (!user?.id) return;  // ENB DOCTRINE: guard user.id not just user
      const { data } = await supabase
        .from('channel_members')
        .select('user_id, role')
        .eq('channel_id', channel.id)
        .eq('user_id', user.id)
        .single();
      setMembership(data);
    };

    const fetchMemberCount = async () => {
      const { count } = await supabase
        .from('channel_members')
        .select('*', { count: 'exact', head: true })
        .eq('channel_id', channel.id);
      setMemberCount(count || 0);
    };

    // Check mute preference from localStorage
    const muteKey = `enb_ch_mute_${channel.id}_${user?.id}`;
    setMuted(localStorage.getItem(muteKey) === '1');

    checkMembership();
    fetchMessages();
    fetchMemberCount();
  }, [channel.id, user, fetchMessages]);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel(`channel-${channel.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`,
      }, () => fetchMessages())
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions',
      }, () => fetchMessages()) // refresh reactions on any change
      .subscribe();
    return () => getDb().removeChannel(ch);
  }, [channel.id, fetchMessages]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Join channel ──────────────────────────────────────────────────────────
  const joinChannel = async () => {
    if (!user?.id) return;  // ENB DOCTRINE: guard user.id not just user
    const role = isSuperAdmin ? 'admin' : 'member';
    await getDb().from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id,
      role,
    });
    setMembership({ user_id: user.id, role });
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (html: string) => {
    if (!html.trim() || !user || sending || !canPost) return;
    setSending(true);

    const { data: inserted } = await supabase
      .from('messages')
      .insert({
        sender_id:    user.id,
        channel_id:   channel.id,
        message_type: 'channel',
        content:      html,
        recipient_id: null,
        team_id:      null,
      })
      .select('id')
      .single();

    // ── L7: detect @mentions and create notifications ──────────────────────
    if (inserted) {
      const mentionRegex = /@([a-zA-Z\s]+?)(?=\s|<|$)/g;
      const mentioned = [...html.matchAll(mentionRegex)].map(m => m[1].trim().toLowerCase());

      if (mentioned.length > 0) {
        // Find users in channel matching the mentioned names
        const { data: members } = await supabase
          .from('channel_members')
          .select('user_id, users(id, full_name)')
          .eq('channel_id', channel.id)
          .neq('user_id', user.id);

        const toNotify = (members || [])
          .filter((m: any) => {
            const name = m.users?.full_name?.toLowerCase() || '';
            return mentioned.some(mn => name.includes(mn));
          })
          .map((m: any) => m.user_id);

        if (toNotify.length > 0) {
          // Inbox reads message_type='mention' rows — no separate notifications table
          await getDb().from('messages').insert(
            toNotify.map((uid: string) => ({
              sender_id:    user.id,
              recipient_id: uid,
              message_type: 'mention',
              channel_id:   channel.id,
              content:      `<p><strong>${user.full_name}</strong> mentioned you in <strong>#${channelData.name}</strong></p>`,
              team_id:      null,
            }))
          );
        }
      }
    }

    setClearTrigger(t => t + 1);
    setSending(false);
  };

  // ── React to message ──────────────────────────────────────────────────────
  const handleReact = async (msgId: string, emoji: string) => {
    if (!user?.id) return;  // ENB DOCTRINE: guard user.id not just user
    // Toggle: if already reacted, remove; otherwise add
    const msg = messages.find(m => m.id === msgId);
    const existing = msg?.reactions?.find(r => r.emoji === emoji && r.reacted);

    if (existing) {
      await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', msgId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);
    } else {
      await getDb().from('message_reactions').insert({
        message_id: msgId,
        user_id:    user.id,
        emoji,
      });
    }
    // Realtime will trigger fetchMessages
  };

  // ── Pin message ───────────────────────────────────────────────────────────
  const handlePin = async (msgId: string) => {
    if (!user || !canPin) return;

    // Unpin any currently pinned message first
    await supabase
      .from('messages')
      .update({ is_pinned: false, pinned_by: null, pinned_at: null })
      .eq('channel_id', channel.id)
      .eq('is_pinned', true);

    // Pin new message
    await supabase
      .from('messages')
      .update({ is_pinned: true, pinned_by: user.id, pinned_at: new Date().toISOString() })
      .eq('id', msgId);

    // L7: notify all channel members of new pin
    const { data: members } = await supabase
      .from('channel_members')
      .select('user_id')
      .eq('channel_id', channel.id)
      .neq('user_id', user.id);

    if (members?.length) {
      // Inbox reads message_type='mention' rows — no separate notifications table
      await getDb().from('messages').insert(
        members.map((m: any) => ({
          sender_id:    user.id,
          recipient_id: m.user_id,
          message_type: 'mention',
          channel_id:   channel.id,
          content:      `<p>📌 A message was pinned in <strong>#${channelData.name}</strong></p>`,
          team_id:      null,
        }))
      );
    }

    fetchMessages();
  };

  // ── Unpin message ─────────────────────────────────────────────────────────
  const handleUnpin = async (msgId: string) => {
    if (!user || !canPin) return;
    await supabase
      .from('messages')
      .update({ is_pinned: false, pinned_by: null, pinned_at: null })
      .eq('id', msgId);
    setPinnedMsg(null);
    fetchMessages();
  };

  // ── Mute toggle (L7) ──────────────────────────────────────────────────────
  const toggleMute = () => {
    const muteKey = `enb_ch_mute_${channel.id}_${user?.id}`;
    const next = !muted;
    setMuted(next);
    localStorage.setItem(muteKey, next ? '1' : '0');
  };

  if (!user) return null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Channel header */}
        <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 shrink-0">
          <button onClick={onBack}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4 text-enb-text-secondary" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            {channelData.posting_mode === 'admin_only'
              ? <Megaphone className="w-4 h-4 text-gray-500" />
              : channelData.posting_mode === 'moderated'
                ? <Lock className="w-4 h-4 text-gray-500" />
                : <Hash className="w-4 h-4 text-gray-500" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-enb-text-primary text-sm truncate">{channelData.name}</p>
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-enb-text-secondary" />
              <span className="text-xs text-enb-text-secondary">{memberCount} members</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                ${channelData.posting_mode === 'admin_only' ? 'bg-blue-50 text-blue-600'
                : channelData.posting_mode === 'moderated'  ? 'bg-amber-50 text-amber-600'
                : 'bg-green-50 text-green-600'}`}>
                {channelData.posting_mode === 'admin_only' ? 'Announcement'
                  : channelData.posting_mode === 'moderated' ? 'Moderated' : 'Open'}
              </span>
            </div>
          </div>

          {/* L7: Mute toggle */}
          {isMember && (
            <button
              onClick={toggleMute}
              title={muted ? 'Unmute notifications' : 'Mute notifications'}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
                ${muted ? 'bg-gray-100 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              {muted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
          )}

          {/* Info panel toggle */}
          <button
            onClick={() => setShowInfo(i => !i)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
              ${showInfo ? 'bg-enb-green/10 text-enb-green' : 'hover:bg-gray-100 text-gray-400'}`}>
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* L6: Pinned announcement banner */}
        {pinnedMsg && showPinnedBanner && (
          <PinnedBanner
            msg={pinnedMsg}
            onDismiss={() => setShowPinnedBanner(false)}
            canUnpin={canPin}
            onUnpin={() => handleUnpin(pinnedMsg.id)}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-enb-surface">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <Hash className="w-7 h-7 text-gray-300" />
              </div>
              <p className="font-semibold text-enb-text-primary">No messages yet</p>
              <p className="text-xs text-enb-text-secondary mt-1">
                {canPost ? 'Be the first to post in this channel.' : 'Messages will appear here.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showDivider = i === 0 || !isSameDay(msg.created_at, prev.created_at);
              const showAvatar = i === 0
                || prev.sender_id !== msg.sender_id
                || !isSameDay(msg.created_at, prev.created_at);
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id}>
                  {showDivider && (
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-enb-text-secondary font-medium shrink-0 bg-enb-surface px-2">
                        {formatDateDivider(msg.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <MessageBubble
                    msg={msg}
                    isMine={isMine}
                    showAvatar={showAvatar}
                    isAdmin={isChannelAdmin}
                    canPin={canPin}
                    onReact={handleReact}
                    onPin={handlePin}
                    onUnpin={handleUnpin}
                  />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-gray-100 shrink-0">
          {!isMember ? (
            <button onClick={joinChannel}
              className="w-full py-2.5 bg-enb-green text-white text-sm font-semibold rounded-xl
                hover:bg-enb-green/90 transition-colors">
              Join Channel to participate
            </button>
          ) : !canPost ? (
            <div className="text-center py-2">
              <p className="text-xs text-enb-text-secondary">Only admins can post in this channel.</p>
            </div>
          ) : (
            <RichTextEditor
              placeholder={`Message #${channelData.name}...`}
              minHeight="44px"
              maxHeight="160px"
              onSubmit={sendMessage}
              submitLabel="Send"
              submitting={sending}
              clearTrigger={clearTrigger}
              channelId={channel.id}
              currentUserId={user.id}
            />
          )}
        </div>
      </div>

      {/* ── Info panel ── */}
      {showInfo && (
        <ChannelInfoPanel
          channel={channelData}
          onClose={() => setShowInfo(false)}
          onChannelUpdated={(updated) => setChannelData(prev => ({ ...prev, ...updated }))}
          onChannelDeleted={onBack}
        />
      )}
    </div>
  );
}
