// src/components/RichTextEditor.tsx
// Shared Tiptap rich text editor — Channels, Announcements, Governance Proposals, CFSP Reports
// Tiptap v3 + React 19

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Mention from '@tiptap/extension-mention';
import { mentionSuggestion } from './MentionSuggestion';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, ListTodo, Link as LinkIcon, Unlink,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Quote, Code, Code2, Minus, Highlighter,
  Undo2, Redo2, Eraser,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  onSubmit?: (html: string) => void;
  submitLabel?: string;
  submitting?: boolean;
  disabled?: boolean;
  className?: string;
  // Footer slot — for target audience pills, char count, draft save, etc.
  footerExtras?: React.ReactNode;
  // Controlled clear
  clearTrigger?: number;
  // For read-only display of content
  content?: string;
  readOnly?: boolean;
  // Mode — compact hides some toolbar groups
  mode?: 'full' | 'compact';
  // For mention notifications
  channelId?: string | null;
  currentUserId?: string;
}

// ─── Toolbar primitives ───────────────────────────────────────────────────────

function ToolBtn({
  onClick, title, active = false, disabled = false, children, wide = false,
}: {
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all select-none shrink-0
        text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed
        ${wide ? 'px-2 h-7 gap-1' : 'w-7 h-7'}
        ${active
          ? 'bg-enb-green text-white shadow-sm'
          : 'text-enb-text-secondary hover:bg-gray-100 hover:text-enb-text-primary'
        }
      `}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />;
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({ editor, mode }: { editor: any; mode: 'full' | 'compact' }) {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('URL:', prev);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    const href = url.startsWith('http') ? url : 'https://' + url;
    editor.chain().focus().setLink({ href, target: '_blank' }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2.5 py-2
      border-b border-gray-100 bg-gray-50/60 shrink-0">

      {/* Block format dropdown */}
      <div className="relative">
        <select
          value={
            editor.isActive('heading', { level: 1 }) ? 'h1'
            : editor.isActive('heading', { level: 2 }) ? 'h2'
            : editor.isActive('heading', { level: 3 }) ? 'h3'
            : editor.isActive('codeBlock') ? 'code'
            : editor.isActive('blockquote') ? 'quote'
            : 'p'
          }
          onChange={e => {
            const v = e.target.value;
            if (v === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (v === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (v === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
            else if (v === 'code') editor.chain().focus().toggleCodeBlock().run();
            else if (v === 'quote') editor.chain().focus().toggleBlockquote().run();
            else editor.chain().focus().setParagraph().run();
          }}
          className="appearance-none text-xs border border-gray-200 rounded-lg
            pl-2 pr-6 py-1 bg-white text-enb-text-secondary outline-none h-7
            cursor-pointer hover:border-enb-green/40 transition-colors font-medium"
        >
          <option value="p">Normal</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="code">Code block</option>
          <option value="quote">Quote</option>
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2
          w-3 h-3 text-gray-400 pointer-events-none" />
      </div>

      <Sep />

      {/* Text styles */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)" active={editor.isActive('bold')}>
        <Bold className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)" active={editor.isActive('italic')}>
        <Italic className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline (Ctrl+U)" active={editor.isActive('underline')}>
        <UnderlineIcon className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough" active={editor.isActive('strike')}>
        <Strikethrough className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()}
        title="Highlight" active={editor.isActive('highlight')}>
        <Highlighter className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline code" active={editor.isActive('code')}>
        <Code className="w-3.5 h-3.5" />
      </ToolBtn>

      <Sep />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet list" active={editor.isActive('bulletList')}>
        <List className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered list" active={editor.isActive('orderedList')}>
        <ListOrdered className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task / checklist" active={editor.isActive('taskList')}>
        <ListTodo className="w-3.5 h-3.5" />
      </ToolBtn>

      {mode === 'full' && (
        <>
          <Sep />

          {/* Alignment */}
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Align left" active={editor.isActive({ textAlign: 'left' })}>
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Center" active={editor.isActive({ textAlign: 'center' })}>
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Align right" active={editor.isActive({ textAlign: 'right' })}>
            <AlignRight className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            title="Justify" active={editor.isActive({ textAlign: 'justify' })}>
            <AlignJustify className="w-3.5 h-3.5" />
          </ToolBtn>
        </>
      )}

      <Sep />

      {/* Link */}
      <ToolBtn onClick={setLink} title="Insert / edit link" active={editor.isActive('link')}>
        <LinkIcon className="w-3.5 h-3.5" />
      </ToolBtn>
      {editor.isActive('link') && (
        <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
          <Unlink className="w-3.5 h-3.5" />
        </ToolBtn>
      )}

      {mode === 'full' && (
        <>
          <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Divider line">
            <Minus className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code block" active={editor.isActive('codeBlock')}>
            <Code2 className="w-3.5 h-3.5" />
          </ToolBtn>
          <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote" active={editor.isActive('blockquote')}>
            <Quote className="w-3.5 h-3.5" />
          </ToolBtn>
        </>
      )}

      <Sep />

      {/* History */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
        <Undo2 className="w-3.5 h-3.5" />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
        <Redo2 className="w-3.5 h-3.5" />
      </ToolBtn>

      <Sep />

      <ToolBtn onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear all formatting" wide>
        <Eraser className="w-3.5 h-3.5" />
        <span className="text-[10px]">Clear</span>
      </ToolBtn>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RichTextEditor({
  placeholder = 'Write something...',
  minHeight = '80px',
  maxHeight = '300px',
  onSubmit,
  submitLabel = 'Send',
  submitting = false,
  disabled = false,
  className = '',
  footerExtras,
  clearTrigger,
  content,
  readOnly = false,
  mode = 'full',
  channelId,
  currentUserId,
}: RichTextEditorProps) {

  // ── Extract mentioned user IDs from editor HTML ────────────────────────────
  const extractMentionIds = useCallback((html: string): string[] => {
    const div = document.createElement('div');
    div.innerHTML = html;
    const mentions = div.querySelectorAll('[data-mention-id]');
    return [...new Set(Array.from(mentions).map(el => el.getAttribute('data-mention-id')!).filter(Boolean))];
  }, []);

  // ── Send mention notifications ─────────────────────────────────────────────
  const sendMentionNotifications = useCallback(async (html: string, messageContent: string) => {
    if (!currentUserId) return;
    const mentionedIds = extractMentionIds(html);
    if (!mentionedIds.length) return;

    // Don't notify yourself
    const others = mentionedIds.filter(id => id !== currentUserId);
    if (!others.length) return;

    // Get sender's name
    const { data: sender } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', currentUserId)
      .single();
    const senderName = sender?.full_name || 'Someone';

    // Insert a notification message for each mentioned user
    const notifications = others.map(recipientId => ({
      sender_id:       currentUserId,
      recipient_id:    recipientId,
      message_type:    'mention',
      content:         `<strong>${senderName}</strong> mentioned you${channelId ? ' in a channel' : ''}: ${messageContent}`,
      channel_id:      channelId || null,
      team_id:         null,
      is_pinned:       false,
      target_audience: 'all',
    }));

    await supabase.from('messages').insert(notifications);
  }, [currentUserId, channelId, extractMentionIds]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable extensions we're adding separately with custom config
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
        blockquote: {},
        // Disable built-in Link and Underline — we add our own configured versions
        // @ts-ignore — v3 StarterKit accepts these
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-enb-green underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Highlight.configure({ multicolor: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Typography,
      TextStyle,
      Color,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: mentionSuggestion,
        renderHTML({ options, node }) {
          return [
            'span',
            {
              class: 'mention inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-semibold bg-enb-green/15 text-enb-green cursor-default',
              'data-mention-id': node.attrs.id,
            },
            `@${node.attrs.label}`,
          ];
        },
      }),
    ],
    content: content || '',
    editable: !disabled && !readOnly,
    editorProps: {
      attributes: {
        class: 'outline-none',
        style: `min-height: ${minHeight}; max-height: ${maxHeight}; overflow-y: auto; padding: 12px 16px;`,
      },
      handleKeyDown(view, event) {
        // Ctrl+Enter / Cmd+Enter to submit
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          const html = view.dom.closest('[data-rte-root]')
            ?.querySelector('[data-rte-submit]')
            ?.dispatchEvent(new Event('rte-submit', { bubbles: true }));
          return true;
        }
        return false;
      },
    },
  });

  // ── Clear editor when clearTrigger increments ────────────────────────────
  useEffect(() => {
    if (clearTrigger === undefined || !editor) return;
    editor.commands.clearContent(true);
  }, [clearTrigger]);

  // ── Sync external content (read-only display) ────────────────────────────
  useEffect(() => {
    if (!editor || !content) return;
    if (editor.getHTML() !== content) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  const handleSubmit = useCallback(() => {
    if (!editor || submitting || disabled) return;
    const html = editor.getHTML();
    // Check for actual content — editor.isEmpty misses mention-only messages
    const hasContent = html && html !== '<p></p>' && html.trim() !== '';
    if (!hasContent) return;
    const plainText = editor.getText();
    onSubmit?.(html);
    sendMentionNotifications(html, plainText);
  }, [editor, onSubmit, submitting, disabled, sendMentionNotifications]);

  // ── Listen for Ctrl+Enter trigger from editorProps ───────────────────────
  const isEmpty = !editor || editor.getHTML() === '<p></p>' || !editor.getHTML().trim();
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const wordCount = editor?.storage.characterCount?.words() ?? 0;

  if (readOnly) {
    return (
      <div
        className={`prose prose-sm max-w-none
          prose-headings:text-enb-text-primary prose-headings:font-semibold prose-headings:my-1
          prose-p:my-0.5 prose-li:my-0.5
          prose-a:text-enb-green prose-a:no-underline hover:prose-a:underline
          prose-code:bg-gray-100 prose-code:text-gray-700 prose-code:px-1 prose-code:rounded prose-code:text-[0.85em]
          prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-xl prose-pre:text-xs
          prose-blockquote:border-l-enb-green prose-blockquote:text-enb-text-secondary prose-blockquote:not-italic
          prose-hr:border-gray-200
          prose-ul:my-1 prose-ol:my-1
          text-enb-text-primary text-sm leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: content || '' }}
      />
    );
  }

  return (
    <div
      data-rte-root
      className={`flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden
        transition-all focus-within:border-enb-green/50 focus-within:shadow-sm
        focus-within:shadow-enb-green/10 ${className}`}
      onKeyDown={e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      {/* Toolbar */}
      {!readOnly && <Toolbar editor={editor} mode={mode} />}

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="flex-1 text-sm text-enb-text-primary
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-1 [&_.ProseMirror_h1]:text-enb-text-primary
          [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:my-1 [&_.ProseMirror_h2]:text-enb-text-primary
          [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:my-0.5 [&_.ProseMirror_h3]:text-enb-text-primary
          [&_.ProseMirror_p]:my-0.5 [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-1 [&_.ProseMirror_ul]:list-disc
          [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-1 [&_.ProseMirror_ol]:list-decimal
          [&_.ProseMirror_li]:my-0.5
          [&_.ProseMirror_a]:text-enb-green [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:cursor-pointer
          [&_.ProseMirror_code]:bg-gray-100 [&_.ProseMirror_code]:text-gray-700 [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:text-[0.85em] [&_.ProseMirror_code]:font-mono
          [&_.ProseMirror_pre]:bg-gray-900 [&_.ProseMirror_pre]:text-gray-100 [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:my-2 [&_.ProseMirror_pre]:text-xs [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:overflow-x-auto
          [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-enb-green [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:my-2 [&_.ProseMirror_blockquote]:text-enb-text-secondary
          [&_.ProseMirror_hr]:border-gray-200 [&_.ProseMirror_hr]:my-3
          [&_.ProseMirror_mark]:bg-enb-gold/30 [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded
          [&_.ProseMirror_ul[data-type=taskList]]:list-none [&_.ProseMirror_ul[data-type=taskList]]:pl-0
          [&_.ProseMirror_li[data-type=taskItem]]:flex [&_.ProseMirror_li[data-type=taskItem]]:gap-2 [&_.ProseMirror_li[data-type=taskItem]]:items-start
          [&_.ProseMirror_li[data-type=taskItem]_label]:flex [&_.ProseMirror_li[data-type=taskItem]_label]:items-center [&_.ProseMirror_li[data-type=taskItem]_label]:mt-0.5
          [&_.ProseMirror_li[data-type=taskItem]_input]:w-3.5 [&_.ProseMirror_li[data-type=taskItem]_input]:h-3.5 [&_.ProseMirror_li[data-type=taskItem]_input]:accent-enb-green
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_.is-editor-empty:first-child::before]:text-gray-400 [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
      />

      {/* Footer */}
      {(onSubmit || footerExtras) && (
        <div className="flex items-center justify-between px-3 py-2
          border-t border-gray-100 bg-gray-50/40 shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {footerExtras}
            <span className="text-[10px] text-gray-400 hidden sm:block shrink-0">
              {wordCount} word{wordCount !== 1 ? 's' : ''} · {charCount} chars
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-gray-400 hidden sm:block">
              Ctrl+Enter to send
            </span>
            {onSubmit && (
              <button
                data-rte-submit
                type="button"
                onClick={handleSubmit}
                disabled={isEmpty || submitting || disabled}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-enb-green text-white
                  text-xs font-semibold rounded-lg hover:bg-enb-green/90
                  disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {submitting
                  ? <><div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />{submitLabel}...</>
                  : submitLabel
                }
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
