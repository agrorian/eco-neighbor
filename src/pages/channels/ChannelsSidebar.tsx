// src/pages/channels/ChannelsSidebar.tsx
// Channel list panel — shown inside /messages when Channels tab is active

import { useState } from 'react';
import { Hash, Lock, Megaphone, Plus, Search, Zap } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  type: string;
  posting_mode: string;
  description: string | null;
  dept_id: string | null;
  region_id: string | null;
  created_by: string;
  auto_generated: boolean;
  member_count: number;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

function timeAgo(ts?: string): string {
  if (!ts) return '';
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function ChannelIcon({ type, postingMode }: { type: string; postingMode: string }) {
  if (postingMode === 'admin_only') return <Megaphone className="w-4 h-4 shrink-0" />;
  if (type === 'mods') return <Lock className="w-4 h-4 shrink-0" />;
  return <Hash className="w-4 h-4 shrink-0" />;
}

function ChannelItem({
  channel,
  isActive,
  onClick,
}: {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left
        ${isActive ? 'bg-enb-green/10' : 'hover:bg-gray-50'}`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
        ${isActive ? 'bg-enb-green/20 text-enb-green' : 'bg-gray-100 text-gray-500'}`}>
        <ChannelIcon type={channel.type} postingMode={channel.posting_mode} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-sm truncate font-medium
            ${isActive ? 'text-enb-green' : 'text-enb-text-primary'}`}>
            {channel.name}
          </span>
          {channel.last_message_at && (
            <span className="text-xs text-enb-text-secondary shrink-0">
              {timeAgo(channel.last_message_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className="text-xs text-enb-text-secondary truncate">
            {channel.last_message || `${channel.member_count} members`}
          </p>
          {(channel.unread_count || 0) > 0 && (
            <span className="shrink-0 min-w-[18px] h-[18px] bg-enb-green text-white
              text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {channel.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

interface ChannelsSidebarProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  onGenerateChannels: () => void;
  isSuperAdmin: boolean;
  loading: boolean;
}

export default function ChannelsSidebar({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  onGenerateChannels,
  isSuperAdmin,
  loading,
}: ChannelsSidebarProps) {
  const [search, setSearch] = useState('');

  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group channels
  const announced  = filtered.filter(c => c.posting_mode === 'admin_only');
  const regular    = filtered.filter(c => c.posting_mode !== 'admin_only');

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-enb-text-primary">Channels</h2>
          <div className="flex items-center gap-1">
            {isSuperAdmin && (
              <button
                onClick={onGenerateChannels}
                title="Generate channels from org structure"
                className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center
                  hover:bg-amber-100 transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-600" />
              </button>
            )}
            <button
              onClick={onCreateChannel}
              title="Create channel"
              className="w-8 h-8 rounded-xl bg-enb-green/10 flex items-center justify-center
                hover:bg-enb-green/20 transition-colors"
            >
              <Plus className="w-4 h-4 text-enb-green" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search channels..."
            className="flex-1 bg-transparent text-xs outline-none text-enb-text-primary
              placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center px-4 py-8">
            <Hash className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-enb-text-secondary">No channels yet.</p>
            {isSuperAdmin && (
              <button
                onClick={onGenerateChannels}
                className="mt-3 text-xs text-enb-green font-medium hover:underline"
              >
                Generate from org structure
              </button>
            )}
          </div>
        ) : (
          <>
            {announced.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-enb-text-secondary
                  uppercase tracking-wider">
                  Announcements
                </p>
                {announced.map(c => (
                  <ChannelItem
                    key={c.id}
                    channel={c}
                    isActive={activeChannelId === c.id}
                    onClick={() => onSelectChannel(c)}
                  />
                ))}
              </div>
            )}
            {regular.length > 0 && (
              <div>
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-enb-text-secondary
                  uppercase tracking-wider">
                  Channels
                </p>
                {regular.map(c => (
                  <ChannelItem
                    key={c.id}
                    channel={c}
                    isActive={activeChannelId === c.id}
                    onClick={() => onSelectChannel(c)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
