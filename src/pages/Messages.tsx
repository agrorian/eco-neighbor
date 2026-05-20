// src/pages/Messages.tsx
// ENB Messages — Direct Messages + Channels in one WhatsApp-style page

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowLeft, MessageCircle, Circle, Hash } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';
import ChannelsSidebar from './channels/ChannelsSidebar';
import ChannelView from './channels/ChannelView';
import CreateChannelModal from './channels/CreateChannelModal';
import GenerateChannelsModal from './channels/GenerateChannelsModal';
import RichTextEditor from '@/components/RichTextEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  full_name: string;
  profile_pic_url?: string;
  role: string;
  neighbourhood?: string;
  last_seen?: string;
}

interface Conversation {
  partner: UserProfile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
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

function isOnline(lastSeen?: string): boolean {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < 5 * 60 * 1000; // 5 min threshold
}

function Avatar({ user, size = 'md', showOnline = false }: {
  user: Partial<UserProfile>;
  size?: 'sm' | 'md' | 'lg';
  showOnline?: boolean;
}) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const dotSizes = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const online = showOnline && isOnline(user.last_seen);
  const initials = user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="relative flex-shrink-0">
      {user.profile_pic_url ? (
        <img src={user.profile_pic_url} alt={user.full_name}
          className={`${sizes[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-enb-green/20 flex items-center justify-center font-semibold text-enb-green`}>
          {initials}
        </div>
      )}
      {showOnline && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full border-2 border-white
          ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
      )}
    </div>
  );
}

// ─── Conversation List Item ───────────────────────────────────────────────────

function ConvoItem({ convo, isActive, onClick }: {
  convo: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
      ${isActive ? 'bg-enb-green/10' : 'hover:bg-gray-50'}`}>
      <Avatar user={convo.partner} size="md" showOnline />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-sm truncate ${isActive ? 'font-semibold text-enb-green' : 'font-medium text-enb-text-primary'}`}>
            {convo.partner.full_name}
          </span>
          <span className="text-xs text-enb-text-secondary shrink-0">
            {timeAgo(convo.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-enb-text-secondary truncate">{convo.lastMessage}</p>
          {convo.unreadCount > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] bg-enb-green text-white text-[10px]
              font-bold rounded-full flex items-center justify-center px-1">
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  // Tick logic:
  // ✓  (gray)  = sent, not yet delivered (no read_at, recent)
  // ✓✓ (gray)  = delivered (message exists in DB = delivered)
  // ✓✓ (blue)  = read by recipient (read_at is set)
  const ticks = isMine ? (
    msg.read_at
      ? <span className="text-[11px] text-blue-300 font-bold tracking-tighter">✓✓</span>
      : <span className="text-[11px] text-white/50 tracking-tighter">✓✓</span>
  ) : null;

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
        ${isMine
          ? 'bg-enb-green text-white rounded-br-sm'
          : 'bg-white border border-gray-100 text-enb-text-primary rounded-bl-sm shadow-sm'
        }`}>
        <div
          className={`prose prose-sm max-w-none
            prose-headings:font-semibold prose-headings:my-0.5
            prose-p:my-0 prose-li:my-0 prose-ul:my-0.5 prose-ol:my-0.5
            prose-a:no-underline hover:prose-a:underline
            prose-code:px-1 prose-code:rounded prose-code:text-[0.8em]
            prose-blockquote:my-1 prose-blockquote:pl-2 prose-blockquote:border-l-2
            ${isMine ? '[&_*]:!text-white [&_a]:!text-white/80 prose-blockquote:border-white/40' : ''}`}
          dangerouslySetInnerHTML={{ __html: msg.content }}
        />
        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-enb-text-secondary'}`}>
            {formatTime(msg.created_at)}
          </span>
          {ticks}
        </div>
      </div>
    </div>
  );
}

// ─── New Message Modal ────────────────────────────────────────────────────────

function NewMessageModal({ currentUserId, onSelect, onClose }: {
  currentUserId: string;
  onSelect: (user: UserProfile) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (search.length < 2) { setUsers([]); return; }
      setLoading(true);
      const { data } = await getDb()
        .from('users')
        .select('id, full_name, profile_pic_url, role, neighbourhood, last_seen')
        .neq('id', currentUserId)
        .ilike('full_name', `%${search}%`)
        .limit(20);
      setUsers(data || []);
      setLoading(false);
    };
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [search, currentUserId]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-enb-text-primary">New Message</h3>
          <button onClick={onClose} className="text-enb-text-secondary hover:text-enb-text-primary text-lg">✕</button>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members by name..."
              className="flex-1 bg-transparent text-sm outline-none text-enb-text-primary placeholder:text-gray-400"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {loading && <p className="text-center text-xs text-enb-text-secondary py-4">Searching...</p>}
          {!loading && search.length >= 2 && users.length === 0 && (
            <p className="text-center text-xs text-enb-text-secondary py-4">No members found.</p>
          )}
          {!loading && search.length < 2 && (
            <p className="text-center text-xs text-enb-text-secondary py-4">Type at least 2 characters to search.</p>
          )}
          {users.map(u => (
            <button key={u.id} onClick={() => onSelect(u)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <Avatar user={u} size="md" showOnline />
              <div className="text-left">
                <p className="text-sm font-medium text-enb-text-primary">{u.full_name}</p>
                <p className="text-xs text-enb-text-secondary capitalize">
                  {u.role}{u.neighbourhood ? ` · ${u.neighbourhood}` : ''}
                </p>
              </div>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full
                ${isOnline(u.last_seen) ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {isOnline(u.last_seen) ? 'Online' : 'Offline'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<'dms' | 'channels'>('dms');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<UserProfile | null>(null);

  // Keep ref in sync — used inside subscriptions to avoid rebuilding on every partner change
  useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [dmClearTrigger, setDmClearTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [showNewMsg, setShowNewMsg] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Channel state
  const [channels, setChannels] = useState<any[]>([]);
  const [activeChannel, setActiveChannel] = useState<any | null>(null);
  const [showChannelChat, setShowChannelChat] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showGenerateChannels, setShowGenerateChannels] = useState(false);

  // ── ENB DOCTRINE: Always use shared isSuperAdmin() from store ────────────
  const isSuperAdmin = checkSuperAdmin(user?.role);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePartnerRef = useRef<UserProfile | null>(null);

  // last_seen is updated globally in Layout.tsx

  // ── Fetch conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    const { data: msgs } = await getDb()
      .from('messages')
      .select('*')
      .eq('message_type', 'direct')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) return;

    // Group by conversation partner
    const partnerMap = new Map<string, { msgs: Message[]; partnerId: string }>();
    msgs.forEach(m => {
      const partnerId = m.sender_id === user.id ? m.recipient_id : m.sender_id;
      if (!partnerMap.has(partnerId)) partnerMap.set(partnerId, { msgs: [], partnerId });
      partnerMap.get(partnerId)!.msgs.push(m);
    });

    // Fetch partner profiles
    const partnerIds = [...partnerMap.keys()];
    if (partnerIds.length === 0) { setConversations([]); return; }

    const { data: profiles } = await getDb()
      .from('users')
      .select('id, full_name, profile_pic_url, role, neighbourhood, last_seen')
      .in('id', partnerIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const convos: Conversation[] = partnerIds.map(pid => {
      const { msgs: pMsgs } = partnerMap.get(pid)!;
      const sorted = [...pMsgs].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = pMsgs.filter(m => m.sender_id === pid && !m.read_at).length;
      return {
        partner: profileMap.get(pid) || { id: pid, full_name: 'Unknown', role: 'member' },
        lastMessage: sorted[0]?.content || '',
        lastMessageAt: sorted[0]?.created_at || '',
        unreadCount: unread,
      };
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    setConversations(convos);
  }, [user?.id]);

  // ── Fetch messages for active conversation ────────────────────────────────
  const fetchMessages = useCallback(async (partnerId: string) => {
    if (!user) return;
    setLoadingMsgs(true);
    const { data } = await getDb()
      .from('messages')
      .select('*')
      .eq('message_type', 'direct')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoadingMsgs(false);

    // Mark ALL unread messages from this partner as read
    const now = new Date().toISOString();
    await getDb()
      .from('messages')
      .update({ read_at: now })
      .eq('message_type', 'direct')
      .eq('sender_id', partnerId)
      .eq('recipient_id', user.id)
      .is('read_at', null);

    // Update local state to reflect read status immediately
    setMessages(prev => prev.map(m =>
      m.sender_id === partnerId && m.recipient_id === user.id && !m.read_at
        ? { ...m, read_at: now }
        : m
    ));
  }, [user?.id]);

  // ── Fetch channels ────────────────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    if (!user) return;
    setLoadingChannels(true);

    // Get channels user is a member of
    const { data: memberOf } = await getDb()
      .from('channel_members')
      .select('channel_id')
      .eq('user_id', user.id);

    const channelIds = (memberOf || []).map(m => m.channel_id);

    if (channelIds.length === 0) {
      // SA can see all channels
      if (isSuperAdmin) {
        const { data } = await getDb().from('channels').select('*').eq('is_active', true).order('name');
        setChannels(data || []);
      } else {
        setChannels([]);
      }
      setLoadingChannels(false);
      return;
    }

    const { data } = await getDb()
      .from('channels')
      .select('*')
      .in('id', isSuperAdmin ? [] : channelIds)
      .eq('is_active', true)
      .order('name');

    // SA sees all
    if (isSuperAdmin) {
      const { data: all } = await getDb().from('channels').select('*').eq('is_active', true).order('name');
      setChannels(all || []);
    } else {
      setChannels(data || []);
    }
    setLoadingChannels(false);
  }, [user, isSuperAdmin]);
  useEffect(() => {
    fetchConversations();
    fetchChannels();
    if (!user) return;

    const channel = getDb()
      .channel('dm-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `message_type=eq.direct`,
      }, (payload) => {
        const msg = payload.new as Message;
        const partner = activePartnerRef.current;
        if (msg.sender_id === user.id || msg.recipient_id === user.id) {
          fetchConversations();
          if (partner &&
            (msg.sender_id === partner.id || msg.recipient_id === partner.id)) {
            setMessages(prev => [...prev, msg]);
            if (msg.sender_id === partner.id) {
              getDb().from('messages').update({ read_at: new Date().toISOString() })
                .eq('id', msg.id).then(() => {});
            }
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
      }, (payload) => {
        const partner = activePartnerRef.current;
        if (partner && payload.new.id === partner.id) {
          setActivePartner(prev => prev ? { ...prev, last_seen: payload.new.last_seen } : prev);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        // Update read receipts in real time
        setMessages(prev => prev.map(m =>
          m.id === payload.new.id ? { ...m, read_at: payload.new.read_at } : m
        ));
      })
      .subscribe();

    return () => getDb().removeChannel(channel);
  }, [fetchConversations, fetchChannels, user]);

  // ── Open conversation ─────────────────────────────────────────────────────
  const openConversation = (partner: UserProfile) => {
    setActivePartner(partner);
    setShowChat(true);
    fetchMessages(partner.id);
  };

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = async (html?: string) => {
    const content = html || newMsg.trim();
    if (!content || !activePartner || !user || sending) return;
    setSending(true);

    const { error } = await getDb().from('messages').insert({
      sender_id: user.id,
      recipient_id: activePartner.id,
      message_type: 'direct',
      content,
      channel_id: null,
      team_id: null,
    });

    setSending(false);
    setNewMsg('');
    setDmClearTrigger(t => t + 1);
    if (error) console.error('Send error:', error);
  };

  // ── Start new DM from modal ───────────────────────────────────────────────
  const startNewDM = (partner: UserProfile) => {
    setShowNewMsg(false);
    openConversation(partner);
  };

  const filteredConvos = conversations.filter(c =>
    c.partner.full_name.toLowerCase().includes(search.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-[calc(100vh-0px)] -m-4 md:-m-6 overflow-hidden">

      {/* ── Left: Conversation / Channel List ── */}
      <div className={`flex flex-col w-full md:w-80 bg-white border-r border-gray-100 flex-shrink-0
        ${(showChat || showChannelChat) ? 'hidden md:flex' : 'flex'}`}>

        {/* Tab bar — DMs / Channels */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab('dms')}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${activeTab === 'dms'
                ? 'text-enb-green border-b-2 border-enb-green'
                : 'text-enb-text-secondary hover:text-enb-text-primary'
              }`}
          >
            Messages
          </button>
          <button
            onClick={() => { setActiveTab('channels'); fetchChannels(); }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors
              ${activeTab === 'channels'
                ? 'text-enb-green border-b-2 border-enb-green'
                : 'text-enb-text-secondary hover:text-enb-text-primary'
              }`}
          >
            Channels
          </button>
        </div>

        {/* DMs panel */}
        {activeTab === 'dms' && (
          <>
            <div className="px-4 py-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-base font-bold text-enb-text-primary">Direct Messages</h1>
                <button onClick={() => setShowNewMsg(true)}
                  className="w-8 h-8 rounded-xl bg-enb-green/10 flex items-center justify-center hover:bg-enb-green/20">
                  <MessageCircle className="w-4 h-4 text-enb-green" />
                </button>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="flex-1 bg-transparent text-sm outline-none text-enb-text-primary placeholder:text-gray-400" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredConvos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-200 mb-3" />
                  <p className="font-semibold text-enb-text-primary text-sm">No messages yet</p>
                  <p className="text-xs text-enb-text-secondary mt-1 mb-4">Start a conversation with a team member</p>
                  <button onClick={() => setShowNewMsg(true)}
                    className="px-4 py-2 bg-enb-green text-white text-sm font-semibold rounded-xl hover:bg-enb-green/90">
                    New Message
                  </button>
                </div>
              ) : (
                filteredConvos.map(c => (
                  <ConvoItem key={c.partner.id} convo={c}
                    isActive={activePartner?.id === c.partner.id}
                    onClick={() => openConversation(c.partner)} />
                ))
              )}
            </div>
          </>
        )}

        {/* Channels panel */}
        {activeTab === 'channels' && (
          <div className="flex-1 overflow-hidden">
            <ChannelsSidebar
              channels={channels}
              activeChannelId={activeChannel?.id || null}
              onSelectChannel={ch => { setActiveChannel(ch); setShowChannelChat(true); }}
              onCreateChannel={() => setShowCreateChannel(true)}
              onGenerateChannels={() => setShowGenerateChannels(true)}
              isSuperAdmin={isSuperAdmin}
              loading={loadingChannels}
            />
          </div>
        )}
      </div>

      {/* ── Right: Chat Panel ── */}
      <div className={`flex-1 flex flex-col bg-enb-surface overflow-hidden
        ${(showChat || showChannelChat) ? 'flex' : 'hidden md:flex'}`}>

        {/* Channel view */}
        {activeTab === 'channels' && activeChannel && (
          <ChannelView
            key={activeChannel.id}
            channel={activeChannel}
            onBack={() => { setShowChannelChat(false); setActiveChannel(null); }}
          />
        )}

        {/* Channel empty state */}
        {activeTab === 'channels' && !activeChannel && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Hash className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="font-bold text-enb-text-primary text-lg">Channels</h2>
            <p className="text-sm text-enb-text-secondary mt-2 max-w-xs">
              Select a channel to start reading and posting group messages.
            </p>
          </div>
        )}

        {/* DM views */}
        {activeTab === 'dms' && activePartner && (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 shrink-0">
              <button onClick={() => setShowChat(false)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 text-enb-text-secondary" />
              </button>
              <Avatar user={activePartner} size="md" showOnline />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-enb-text-primary text-sm truncate">{activePartner.full_name}</p>
                <div className="flex items-center gap-1.5">
                  <Circle className={`w-2 h-2 fill-current ${isOnline(activePartner.last_seen) ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className="text-xs text-enb-text-secondary">
                    {isOnline(activePartner.last_seen) ? 'Online'
                      : activePartner.last_seen ? `Last seen ${timeAgo(activePartner.last_seen)}` : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Avatar user={activePartner} size="lg" />
                  <p className="font-semibold text-enb-text-primary mt-3">{activePartner.full_name}</p>
                  <p className="text-xs text-enb-text-secondary mt-1 capitalize">
                    {activePartner.role}{activePartner.neighbourhood ? ` · ${activePartner.neighbourhood}` : ''}
                  </p>
                  <p className="text-xs text-enb-text-secondary mt-4 bg-white rounded-xl px-4 py-2 border border-gray-100">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const showDivider = i === 0 || !isSameDay(msg.created_at, messages[i - 1].created_at);
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
                      <ChatBubble msg={msg} isMine={msg.sender_id === user.id} />
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="px-3 py-3 bg-white border-t border-gray-100 shrink-0">
              <RichTextEditor
                placeholder={`Message ${activePartner.full_name}...`}
                minHeight="44px"
                maxHeight="160px"
                onSubmit={sendMessage}
                submitLabel="Send"
                submitting={sending}
                clearTrigger={dmClearTrigger}
                mode="compact"
                currentUserId={user.id}
                channelId={null}
              />
            </div>
          </>
        )}

        {activeTab === 'dms' && !activePartner && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-enb-green/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-enb-green" />
            </div>
            <h2 className="font-bold text-enb-text-primary text-lg">Your Messages</h2>
            <p className="text-sm text-enb-text-secondary mt-2 max-w-xs">
              Send private messages to team members and other ENB community members.
            </p>
            <button onClick={() => setShowNewMsg(true)}
              className="mt-6 px-6 py-2.5 bg-enb-green text-white text-sm font-semibold rounded-xl hover:bg-enb-green/90">
              Start a Conversation
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewMsg && (
        <NewMessageModal currentUserId={user.id} onSelect={startNewDM} onClose={() => setShowNewMsg(false)} />
      )}
      {showCreateChannel && (
        <CreateChannelModal
          onCreated={() => { setShowCreateChannel(false); fetchChannels(); }}
          onClose={() => setShowCreateChannel(false)}
        />
      )}
      {showGenerateChannels && (
        <GenerateChannelsModal
          onGenerated={() => { setShowGenerateChannels(false); fetchChannels(); }}
          onClose={() => setShowGenerateChannels(false)}
        />
      )}
    </div>
  );
}
