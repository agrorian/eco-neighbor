// src/pages/admin/AnnouncementsPage.jsx
// ENB Super Admin — Broadcast Announcements
// Stack: React 19, Supabase JS 2.98, Tailwind CSS 4, shadcn/ui

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_OPTIONS = [
  { value: 'all',          label: 'All Users' },
  { value: 'cfsp',         label: 'CFSP Members' },
  { value: 'mods',         label: 'Moderators' },
  { value: 'food_runners', label: 'Food Runners' },
  { value: 'cfg',          label: 'CFG Team' },
]

const SUPER_ADMIN_ID = '3b2d64ca-2579-43dd-9f6c-a63fe5508422'

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolBtn({ onClick, title, children, className = '' }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs text-muted-foreground
        hover:bg-background hover:text-foreground border border-transparent
        hover:border-border transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

// ─── Rich Text Toolbar ────────────────────────────────────────────────────────

function Toolbar({ editorRef }) {
  const exec = (cmd, value = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
  }

  const handleHeading = (e) => {
    editorRef.current?.focus()
    document.execCommand('formatBlock', false, e.target.value)
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (!url) return
    editorRef.current?.focus()
    document.execCommand('createLink', false, url.startsWith('http') ? url : 'https://' + url)
  }

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/40">
      <select
        onChange={handleHeading}
        defaultValue="p"
        className="text-xs border border-border rounded px-1.5 py-1 bg-background text-foreground h-7"
      >
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolBtn onClick={() => exec('bold')} title="Bold"><b>B</b></ToolBtn>
      <ToolBtn onClick={() => exec('italic')} title="Italic"><i>I</i></ToolBtn>
      <ToolBtn onClick={() => exec('underline')} title="Underline"><u>U</u></ToolBtn>
      <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><s>S</s></ToolBtn>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolBtn onClick={() => exec('insertUnorderedList')} title="Bullet list">• —</ToolBtn>
      <ToolBtn onClick={() => exec('insertOrderedList')} title="Numbered list">1.</ToolBtn>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolBtn onClick={insertLink} title="Insert link">🔗</ToolBtn>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolBtn onClick={() => exec('justifyLeft')} title="Align left">⇤</ToolBtn>
      <ToolBtn onClick={() => exec('justifyCenter')} title="Center">↔</ToolBtn>
      <ToolBtn onClick={() => exec('justifyRight')} title="Align right">⇥</ToolBtn>

      <div className="w-px h-5 bg-border mx-1" />

      <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting" className="text-xs !w-auto px-2">
        Clear fmt
      </ToolBtn>
    </div>
  )
}

// ─── Message Card ─────────────────────────────────────────────────────────────

function MessageCard({ msg, onDelete, onPin, isDraft = false, onLoadDraft }) {
  const timeAgo = (ts) => {
    const s = Math.floor((Date.now() - new Date(ts)) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return new Date(ts).toLocaleDateString()
  }

  // target_audience is stored as metadata in the message row
  const targetLabel = TARGET_OPTIONS.find(t => t.value === msg.target_audience)?.label || 'All Users'

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      {!isDraft && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-medium text-blue-700 dark:text-blue-300 shrink-0">
            SA
          </div>
          <span className="text-sm font-medium text-foreground">Super Admin</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">
            {targetLabel}
          </span>
          {msg.is_pinned && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
              Pinned
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{timeAgo(msg.created_at)}</span>
        </div>
      )}

      {isDraft && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Draft · {timeAgo(msg.created_at)}</span>
        </div>
      )}

      <div
        className="text-sm leading-relaxed text-foreground prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: msg.content }}
      />

      <div className="flex gap-3 mt-2 pt-2 border-t border-border/50">
        {isDraft ? (
          <>
            <button
              onClick={() => onLoadDraft(msg)}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Load
            </button>
            <button
              onClick={() => onDelete(msg.id)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Delete
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onPin(msg)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {msg.is_pinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={() => onDelete(msg.id)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const editorRef = useRef(null)
  const [selectedTarget, setSelectedTarget] = useState('all')
  const [charCount, setCharCount] = useState(0)
  const [messages, setMessages] = useState([])
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Fetch announcements ────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('message_type', 'broadcast')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) { console.error('Fetch error:', error); return }
    setMessages(data || [])
    setLoading(false)
  }, [])

  // ── Realtime subscription ──────────────────────────────────────────────────
  useEffect(() => {
    fetchMessages()

    const channel = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: 'message_type=eq.broadcast',
      }, () => fetchMessages())
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchMessages])

  // ── Load drafts from localStorage ─────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('enb_announcement_drafts')
      if (saved) setDrafts(JSON.parse(saved))
    } catch {}
  }, [])

  const persistDrafts = (d) => {
    localStorage.setItem('enb_announcement_drafts', JSON.stringify(d))
  }

  // ── Editor helpers ─────────────────────────────────────────────────────────
  const getContent = () => editorRef.current?.innerHTML?.trim() || ''
  const clearEditor = () => {
    if (editorRef.current) editorRef.current.innerHTML = ''
    setCharCount(0)
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  const sendAnnouncement = async () => {
    const content = getContent()
    if (!content || !editorRef.current?.innerText?.trim()) {
      showToast('Write something first.', 'error')
      return
    }

    setSending(true)

    const { error } = await supabase.from('messages').insert({
      sender_id: SUPER_ADMIN_ID,
      message_type: 'broadcast',
      content,
      target_audience: selectedTarget,   // <-- add this column (see migration below)
      channel_id: null,
      recipient_id: null,
      team_id: null,
    })

    setSending(false)

    if (error) {
      console.error('Send error:', error)
      showToast('Failed to send. Check console.', 'error')
      return
    }

    clearEditor()
    const label = TARGET_OPTIONS.find(t => t.value === selectedTarget)?.label
    showToast(`Announcement sent to ${label}!`)
  }

  // ── Draft ──────────────────────────────────────────────────────────────────
  const saveDraft = () => {
    const content = getContent()
    if (!content || !editorRef.current?.innerText?.trim()) {
      showToast('Nothing to save.', 'error')
      return
    }
    const updated = [
      ...drafts,
      { id: Date.now(), content, created_at: new Date().toISOString() },
    ]
    setDrafts(updated)
    persistDrafts(updated)
    showToast('Draft saved.')
  }

  const loadDraft = (draft) => {
    if (editorRef.current) {
      editorRef.current.innerHTML = draft.content
      setCharCount(editorRef.current.innerText.length)
    }
    showToast('Draft loaded.')
  }

  const deleteDraft = (id) => {
    const updated = drafts.filter(d => d.id !== id)
    setDrafts(updated)
    persistDrafts(updated)
  }

  // ── Delete / Pin ───────────────────────────────────────────────────────────
  const deleteMessage = async (id) => {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) { showToast('Delete failed.', 'error'); return }
    setMessages(prev => prev.filter(m => m.id !== id))
    showToast('Deleted.')
  }

  const pinMessage = async (msg) => {
    const { error } = await supabase
      .from('messages')
      .update({ is_pinned: !msg.is_pinned })
      .eq('id', msg.id)
    if (error) { showToast('Pin failed.', 'error'); return }
    setMessages(prev =>
      prev.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m)
    )
    showToast(msg.is_pinned ? 'Unpinned.' : 'Pinned.')
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📢</span>
        <div>
          <h1 className="text-xl font-medium text-foreground">Announcements</h1>
          <p className="text-sm text-muted-foreground">Broadcast messages to ENB users</p>
        </div>
        <span className="ml-auto text-xs px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium">
          Super Admin
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* ── Composer ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">

          {/* Targeting pills */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Send to
            </p>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map(t => (
                <button
                  key={t.value}
                  onClick={() => setSelectedTarget(t.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                    ${selectedTarget === t.value
                      ? 'bg-foreground text-background border-transparent'
                      : 'bg-transparent text-muted-foreground border-border hover:border-foreground/40'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          <Toolbar editorRef={editorRef} />

          {/* Content-editable editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setCharCount(e.currentTarget.innerText.length)}
            data-placeholder="Write your announcement here..."
            className="min-h-[160px] px-4 py-3 text-sm leading-relaxed text-foreground outline-none
              prose prose-sm dark:prose-invert max-w-none
              before:content-[attr(data-placeholder)] before:text-muted-foreground
              [&:not(:empty)]:before:hidden"
          />

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">{charCount} characters</span>
            <div className="flex gap-2">
              <button
                onClick={saveDraft}
                className="px-3 py-1.5 text-xs rounded-md border border-border
                  bg-transparent text-foreground hover:bg-muted transition-colors"
              >
                Save draft
              </button>
              <button
                onClick={sendAnnouncement}
                disabled={sending}
                className="px-4 py-1.5 text-xs rounded-md bg-foreground text-background
                  font-medium hover:opacity-85 disabled:opacity-50 transition-opacity"
              >
                {sending ? 'Sending...' : 'Send announcement'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4">

          {/* Sent feed */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">Sent Announcements</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {messages.length}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
              {loading ? (
                <p className="text-xs text-muted-foreground text-center py-6">Loading...</p>
              ) : messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No announcements yet.
                </p>
              ) : (
                messages.map(msg => (
                  <MessageCard
                    key={msg.id}
                    msg={msg}
                    onDelete={deleteMessage}
                    onPin={pinMessage}
                  />
                ))
              )}
            </div>
          </div>

          {/* Drafts */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">Drafts</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {drafts.length}
              </span>
            </div>
            <div className="p-3 flex flex-col gap-2 max-h-[240px] overflow-y-auto">
              {drafts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No saved drafts.</p>
              ) : (
                drafts.slice().reverse().map(d => (
                  <MessageCard
                    key={d.id}
                    msg={d}
                    isDraft
                    onDelete={deleteDraft}
                    onLoadDraft={loadDraft}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full
            text-sm font-medium z-50 transition-all
            ${toast.type === 'error'
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-foreground text-background'
            }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
