// src/components/MentionSuggestion.tsx
// Tiptap @mention suggestion dropdown — used by RichTextEditor
// Queries Supabase users table, renders a tippy.js popup

import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { supabase } from '@/lib/supabase';
import 'tippy.js/dist/tippy.css';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MentionUser {
  id: string;
  label: string;          // full_name — what Tiptap stores
  role: string;
  profile_pic_url: string | null;
}

// ─── Dropdown list component ──────────────────────────────────────────────────

interface MentionListProps {
  items: MentionUser[];
  command: (item: MentionUser) => void;
}

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when items change
  useEffect(() => setSelectedIndex(0), [items]);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) command(item);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(i => (i + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex(i => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-lg p-3 min-w-[180px]">
        <p className="text-xs text-gray-400 text-center">No members found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden
      min-w-[200px] max-w-[260px] max-h-[220px] overflow-y-auto">
      {items.map((item, index) => {
        const initials = item.label.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const isSelected = index === selectedIndex;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => selectItem(index)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left
              transition-colors border-b border-gray-50 last:border-0
              ${isSelected ? 'bg-enb-green/10' : 'hover:bg-gray-50'}`}
          >
            {/* Avatar */}
            {item.profile_pic_url ? (
              <img src={item.profile_pic_url} alt={item.label}
                className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-xs font-bold shrink-0
                ${isSelected ? 'bg-enb-green text-white' : 'bg-enb-green/20 text-enb-green'}`}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate
                ${isSelected ? 'text-enb-green' : 'text-enb-text-primary'}`}>
                {item.label}
              </p>
              <p className="text-[10px] text-enb-text-muted capitalize">{item.role}</p>
            </div>
            {isSelected && (
              <span className="text-[9px] text-enb-green font-semibold shrink-0">↵</span>
            )}
          </button>
        );
      })}
    </div>
  );
});

MentionList.displayName = 'MentionList';

// ─── Suggestion config (passed to Mention.configure) ─────────────────────────

export const mentionSuggestion = {
  // Fetch matching users from Supabase
  items: async ({ query }: { query: string }): Promise<MentionUser[]> => {
    if (!query && query !== '') return [];
    const { data } = await getDb()
      .from('users')
      .select('id, full_name, role, profile_pic_url')
      .ilike('full_name', `%${query}%`)
      .limit(8);
    return (data || []).map(u => ({
      id: u.id,
      label: u.full_name || 'Unknown',
      role: u.role || 'member',
      profile_pic_url: u.profile_pic_url || null,
    }));
  },

  render: () => {
    let component: ReactRenderer<MentionListRef>;
    let popup: TippyInstance[];

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) return;

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'light-border',
          animation: 'shift-away',
          maxWidth: 'none',
          zIndex: 9999,
        });
      },

      onUpdate: (props: any) => {
        component.updateProps(props);
        if (!props.clientRect) return;
        popup[0].setProps({ getReferenceClientRect: props.clientRect });
      },

      onKeyDown: (props: any) => {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props) ?? false;
      },

      onExit: () => {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
