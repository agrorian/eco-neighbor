// src/pages/admin/AnnouncementsPage.tsx
// ENB Super Admin — Broadcast Announcements
// Upgraded to Tiptap RichTextEditor

import { useState, useEffect, useCallback } from 'react';
import { Pin, Trash2, Send, Users, Clock } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore } from '@/store/user';
import RichTextEditor from '@/components/RichTextEditor';

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_OPTIONS = [
  { value: 'all',          label: 'All Users',     color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'cfsp',         label: 'CFSP Members',  color: 'bg-green-50 text-green-700 border-green-100' },
  { value: 'mods',         label: 'Moderators',    color: 'bg-purple-50 text-purple-700 border-purple-100' },
  { value: 'food_runners', label: 'Food Runners',  color: 'bg-orange-50 text-orange-700 border-orange-100' },
  { value: 'cfg',          label: 'CFG Team',      color: 'bg-teal-50 text-teal-700 border-teal-100' },
];

interface Message {
  id: string;
  content: string;
  target_audience: string;
  is_pinned: boolean;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string): string {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' });
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({ msg, onDelete, onPin }: {
  msg: Message;
  onDelete: (id: string) => void;
  onPin: (msg: Message) => void;
}) {
  const target = TARGET_OPTIONS.find(t => t.value === msg.target_audience) || TARGET_OPTIONS[0];

  return (
    <div className={`rounded-xl border p-3.5 transition-all
      ${msg.is_pinned ? 'border-enb-gold/40 bg-enb-gold/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>

      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${target.color}`}>
            {target.label}
          </span>
          {msg.is_pinned && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full
              bg-enb-gold/20 text-enb-gold-dark border border-enb-gold/30 font-semibold">
              <Pin className="w-2.5 h-2.5" />Pinned
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[10px] text-enb-text-muted shrink-0">
          <Clock className="w-2.5 h-2.5" />{timeAgo(msg.created_at)}
        </span>
      </div>

      {/* Rich content rendered */}
      <RichTextEditor
        content={msg.content}
        readOnly
        className="border-0 !rounded-none !shadow-none !bg-transparent"
      />

      <div className="flex gap-3 mt-2.5 pt-2 border-t border-gray-100">
        <button onClick={() => onPin(msg)}
          className={`text-xs font-medium transition-colors flex items-center gap-1
            ${msg.is_pinned ? 'text-enb-gold-dark hover:text-enb-gold' : 'text-enb-text-muted hover:text-enb-text-primary'}`}>
          <Pin className="w-3 h-3" />
          {msg.is_pinned ? 'Unpin' : 'Pin'}
        </button>
        <button onClick={() => onDelete(msg.id)}
          className="text-xs font-medium text-enb-text-muted hover:text-red-500
            transition-colors flex items-center gap-1 ml-auto">
          <Trash2 className="w-3 h-3" />Delete
        </button>
      </div>
    </div>
  );
}

// ─── Draft Card ───────────────────────────────────────────────────────────────

function DraftCard({ draft, onLoad, onDelete }: {
  draft: any;
  onLoad: (d: any) => void;
  onDelete: (id: any) => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-3 bg-gray-50/50">
      <p className="text-[10px] text-enb-text-muted mb-2 flex items-center gap-1">
        <Clock className="w-2.5 h-2.5" />Draft · {timeAgo(draft.created_at)}
      </p>
      <div
        className="text-xs text-enb-text-secondary line-clamp-2 prose prose-xs max-w-none mb-2"
        dangerouslySetInnerHTML={{ __html: draft.content }}
      />
      <div className="flex gap-2">
        <button onClick={() => onLoad(draft)}
          className="text-xs font-semibold text-enb-green hover:text-enb-green/80 transition-colors">
          Load draft
        </button>
        <button onClick={() => onDelete(draft.id)}
          className="text-xs text-enb-text-muted hover:text-red-500 transition-colors ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full
      text-sm font-semibold z-50 shadow-lg transition-all
      ${type === 'error' ? 'bg-red-500 text-white' : 'bg-enb-text-primary text-white'}`}>
      {msg}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const { user } = useUserStore();
  const [selectedTarget, setSelectedTarget] = useState('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [clearTrigger, setClearTrigger] = useState(0);
  const [draftContent, setDraftContent] = useState<string | undefined>(undefined);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Fetch announcements ──────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data } = await getDb()
      .from('messages')
      .select('*')
      .eq('message_type', 'broadcast')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    setMessages(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
    // Load drafts from localStorage
    try {
      const saved = localStorage.getItem(`enb_announce_drafts_${user?.id}`);
      if (saved) setDrafts(JSON.parse(saved));
    } catch {}

    const channel = getDb()
      .channel('announcements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages',
        filter: 'message_type=eq.broadcast' }, fetchMessages)
      .subscribe();
    return () => getDb().removeChannel(channel);
  }, [fetchMessages, user?.id]);

  const persistDrafts = (d: any[]) => {
    localStorage.setItem(`enb_announce_drafts_${user?.id}`, JSON.stringify(d));
  };

  // ── Send announcement ────────────────────────────────────────────────────
  const handleSend = async (html: string) => {
    if (!user) return;
    setSending(true);
    const { error } = await getDb().from('messages').insert({
      sender_id:       user.id,
      message_type:    'broadcast',
      content:         html,
      target_audience: selectedTarget,
      is_pinned:       false,
    });
    setSending(false);
    if (error) { showToast('Failed to send.', 'error'); return; }
    setClearTrigger(t => t + 1);
    setDraftContent(undefined);
    showToast('Announcement sent!');
  };

  // ── Save draft ───────────────────────────────────────────────────────────
  const saveDraft = (html: string) => {
    if (!html || html === '<p></p>') return;
    const updated = [...drafts, {
      id: Date.now(),
      content: html,
      target: selectedTarget,
      created_at: new Date().toISOString(),
    }];
    setDrafts(updated);
    persistDrafts(updated);
    showToast('Draft saved.');
  };

  const loadDraft = (draft: any) => {
    setDraftContent(draft.content);
    if (draft.target) setSelectedTarget(draft.target);
    showToast('Draft loaded.');
  };

  const deleteDraft = (id: any) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    persistDrafts(updated);
  };

  const deleteMessage = async (id: string) => {
    await getDb().from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    showToast('Deleted.');
  };

  const pinMessage = async (msg: Message) => {
    await getDb().from('messages').update({ is_pinned: !msg.is_pinned }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m));
    showToast(msg.is_pinned ? 'Unpinned.' : 'Pinned.');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">

      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-enb-green/10 flex items-center justify-center">
          <Send className="w-5 h-5 text-enb-green" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-enb-text-primary">Announcements</h1>
          <p className="text-sm text-enb-text-secondary">Broadcast messages to ENB members</p>
        </div>
        <span className="ml-auto text-xs px-3 py-1 rounded-full bg-enb-green/10
          text-enb-green font-semibold">
          Super Admin
        </span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

        {/* ── Composer ── */}
        <div className="space-y-3">

          {/* Target audience */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-enb-text-secondary" />
              <p className="text-xs font-bold text-enb-text-secondary uppercase tracking-wider">
                Send to
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setSelectedTarget(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                    ${selectedTarget === t.value
                      ? 'bg-enb-green text-white border-enb-green shadow-sm'
                      : `${t.color} hover:opacity-80`
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rich text editor */}
          <RichTextEditor
            placeholder="Write your announcement here..."
            minHeight="140px"
            maxHeight="400px"
            onSubmit={handleSend}
            submitLabel="Send Announcement"
            submitting={sending}
            clearTrigger={clearTrigger}
            content={draftContent}
            mode="full"
            footerExtras={
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  // Grab current content via a custom event
                  const el = e.currentTarget.closest('[data-rte-root]');
                  const prosemirror = el?.querySelector('.ProseMirror');
                  if (prosemirror) {
                    // We get HTML from the editor via a ref stored in parent
                    // Simple approach: save what's in the DOM
                    saveDraft(prosemirror.innerHTML);
                  }
                }}
                className="text-xs text-enb-text-muted hover:text-enb-text-primary
                  font-medium transition-colors"
              >
                Save draft
              </button>
            }
          />
        </div>

        {/* ── Right column ── */}
        <div className="space-y-4">

          {/* Sent announcements */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-enb-text-primary">Sent</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100
                text-enb-text-secondary font-medium">
                {messages.length}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              {loading ? (
                <p className="text-xs text-enb-text-muted text-center py-6">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-enb-text-muted text-center py-6">
                  No announcements yet.
                </p>
              ) : messages.map(msg => (
                <MessageCard key={msg.id} msg={msg} onDelete={deleteMessage} onPin={pinMessage} />
              ))}
            </div>
          </div>

          {/* Drafts */}
          {drafts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-enb-text-primary">Drafts</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100
                  text-enb-text-secondary font-medium">
                  {drafts.length}
                </span>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-[300px] overflow-y-auto">
                {drafts.slice().reverse().map(d => (
                  <DraftCard key={d.id} draft={d} onLoad={loadDraft} onDelete={deleteDraft} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}
