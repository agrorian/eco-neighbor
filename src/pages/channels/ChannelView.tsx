// src/pages/channels/ChannelView.tsx
// Channel chat panel — realtime group messaging

import { useState, useEffect, useRef, useCallback } from 'react';
import { Hash, Users, Megaphone, Lock, ArrowLeft, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import ChannelInfoPanel from './ChannelInfoPanel';
import RichTextEditor from '@/components/RichTextEditor';

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

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: { full_name: string; profile_pic_url: string | null; role: string };
}

interface ChannelMember {
  user_id: string;
  role: string;
}

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

function MessageBubble({ msg, isMine, showAvatar }: {
  msg: Message;
  isMine: boolean;
  showAvatar: boolean;
}) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar — only shown for first message in a group */}
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
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
          ${isMine
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
      </div>
    </div>
  );
}

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

  // Sync channelData when a different channel is selected
  useEffect(() => {
    setChannelData(channel);
    setMessages([]);
    setMembership(null);
    setMemberCount(channel.member_count || 0);
    setShowInfo(false);
  }, [channel.id]);
  const [clearTrigger, setClearTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Check membership + fetch messages ─────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at')
      .eq('message_type', 'channel')
      .eq('channel_id', channel.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data?.length) { setMessages([]); return; }

    // Fetch sender profiles
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('users')
      .select('id, full_name, profile_pic_url, role')
      .in('id', senderIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setMessages(data.map(m => ({
      ...m,
      sender: profileMap.get(m.sender_id),
    })));
  }, [channel.id]);

  useEffect(() => {
    const checkMembership = async () => {
      if (!user) return;
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

    checkMembership();
    fetchMessages();
    fetchMemberCount();
  }, [channel.id, user, fetchMessages]);

  // ── Realtime ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel(`channel-${channel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel_id=eq.${channel.id}`,
      }, () => fetchMessages())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [channel.id, fetchMessages]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Can user post? ─────────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'admin';
  const isAdmin = membership?.role === 'admin' || isSuperAdmin;
  const isModerator = membership?.role === 'moderator';
  const canPost = channelData.posting_mode === 'open'
    ? !!membership
    : channelData.posting_mode === 'admin_only'
      ? isAdmin
      : !!membership; // moderated — anyone can post, admin approves

  const isMember = !!membership;

  // ── Join channel ───────────────────────────────────────────────────────────
  const joinChannel = async () => {
    if (!user) return;
    const role = user.role === 'admin' ? 'admin' : 'member';
    await supabase.from('channel_members').insert({
      channel_id: channel.id,
      user_id: user.id,
      role,
    });
    setMembership({ user_id: user.id, role });
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (html: string) => {
    if (!html.trim() || !user || sending || !canPost) return;
    setSending(true);

    await supabase.from('messages').insert({
      sender_id:    user.id,
      channel_id:   channel.id,
      message_type: 'channel',
      content:      html,
      recipient_id: null,
      team_id:      null,
    });

    setClearTrigger(t => t + 1);
    setSending(false);
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
          <button
            onClick={() => setShowInfo(i => !i)}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors
              ${showInfo ? 'bg-enb-green/10 text-enb-green' : 'hover:bg-gray-100 text-gray-400'}`}>
            <Info className="w-4 h-4" />
          </button>
        </div>

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
              const showAvatar = i === 0 || prev.sender_id !== msg.sender_id
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
                  <MessageBubble msg={msg} isMine={isMine} showAvatar={showAvatar} />
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
              <p className="text-xs text-enb-text-secondary">Only admins and Super Admin can post here.</p>
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

      {/* ── Info panel (slide in from right) ── */}
      {showInfo && (
        <ChannelInfoPanel
          channel={channelData}
          onClose={() => setShowInfo(false)}
          onChannelUpdated={(updated) => {
            setChannelData(prev => ({ ...prev, ...updated }));
          }}
          onChannelDeleted={onBack}
        />
      )}
    </div>
  );
}
