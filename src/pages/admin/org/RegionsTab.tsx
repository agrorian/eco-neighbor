// src/pages/admin/org/RegionsTab.tsx
// Geographic hierarchy builder — Country > Province > City Group > City > Neighbourhood Group > Neighbourhood

import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronDown, Plus, Pencil, Check, X, MapPin, Layers } from 'lucide-react';
import { supabase, getDb } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Region {
  id: string;
  name: string;
  level: string;
  is_group: boolean;
  parent_id: string | null;
  description: string | null;
  is_active: boolean;
  children?: Region[];
}

const LEVEL_ORDER = [
  'country',
  'province',
  'city_group',
  'city',
  'neighbourhood_group',
  'neighbourhood',
];

const LEVEL_META: Record<string, { label: string; childLabel: string; color: string; indent: number }> = {
  country:            { label: 'Country',            childLabel: 'Add Province',           color: 'text-blue-700',   indent: 0 },
  province:           { label: 'Province',           childLabel: 'Add City Group or City', color: 'text-indigo-600', indent: 1 },
  city_group:         { label: 'City Group',         childLabel: 'Add City',               color: 'text-purple-600', indent: 2 },
  city:               { label: 'City',               childLabel: 'Add Neighbourhood Group or Neighbourhood', color: 'text-teal-600', indent: 3 },
  neighbourhood_group:{ label: 'Neighbourhood Group',childLabel: 'Add Neighbourhood',      color: 'text-orange-600', indent: 4 },
  neighbourhood:      { label: 'Neighbourhood',      childLabel: '',                        color: 'text-enb-green',  indent: 5 },
};

// What levels can be added under each level
const ALLOWED_CHILDREN: Record<string, Array<{ level: string; is_group: boolean; label: string }>> = {
  country:             [{ level: 'province',            is_group: false, label: 'Province' }],
  province:            [
    { level: 'city_group', is_group: true,  label: 'City Group (Regional Cluster)' },
    { level: 'city',       is_group: false, label: 'City (standalone)' },
  ],
  city_group:          [{ level: 'city',               is_group: false, label: 'City' }],
  city:                [
    { level: 'neighbourhood_group', is_group: true,  label: 'Neighbourhood Group (Cluster)' },
    { level: 'neighbourhood',       is_group: false, label: 'Neighbourhood (standalone)' },
  ],
  neighbourhood_group: [{ level: 'neighbourhood',      is_group: false, label: 'Neighbourhood' }],
  neighbourhood:       [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildTree(flat: Region[]): Region[] {
  const map = new Map<string, Region>();
  const roots: Region[] = [];
  flat.forEach(r => map.set(r.id, { ...r, children: [] }));
  map.forEach(r => {
    if (r.parent_id && map.has(r.parent_id)) {
      map.get(r.parent_id)!.children!.push(r);
    } else {
      roots.push(r);
    }
  });
  return roots;
}

// ─── Add Region Form ──────────────────────────────────────────────────────────

function AddRegionForm({
  parentId,
  level,
  isGroup,
  label,
  onSave,
  onCancel,
}: {
  parentId: string;
  level: string;
  isGroup: boolean;
  label: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await getDb().from('regions').insert({
      name: name.trim(),
      level,
      is_group: isGroup,
      parent_id: parentId,
      description: description.trim() || null,
    });
    setSaving(false);
    if (error) { console.error(error); return; }
    onSave();
  };

  return (
    <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
      <p className="text-xs font-semibold text-enb-text-secondary mb-2">New {label}</p>
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        placeholder={`${label} name...`}
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white
          outline-none focus:border-enb-green text-enb-text-primary mb-2"
      />
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white
          outline-none focus:border-enb-green text-enb-text-primary mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!name.trim() || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-enb-green text-white text-xs
            font-semibold rounded-lg hover:bg-enb-green/90 disabled:opacity-50 transition-colors"
        >
          <Check className="w-3 h-3" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200
            text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors text-enb-text-secondary"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Edit Region Inline ───────────────────────────────────────────────────────

function EditRegionForm({ region, onSave, onCancel }: {
  region: Region;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(region.name);
  const [description, setDescription] = useState(region.description || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await getDb().from('regions').update({
      name: name.trim(),
      description: description.trim() || null,
    }).eq('id', region.id);
    setSaving(false);
    onSave();
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        className="flex-1 text-sm px-2 py-1 rounded-lg border border-enb-green bg-white
          outline-none text-enb-text-primary"
      />
      <button onClick={save} disabled={saving}
        className="w-6 h-6 rounded-md bg-enb-green text-white flex items-center justify-center">
        <Check className="w-3 h-3" />
      </button>
      <button onClick={onCancel}
        className="w-6 h-6 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Region Node ──────────────────────────────────────────────────────────────

function RegionNode({ region, onRefresh }: { region: Region; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(region.level === 'country' || region.level === 'province');
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState<{ level: string; is_group: boolean; label: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const meta = LEVEL_META[region.level];
  const allowedChildren = ALLOWED_CHILDREN[region.level] || [];
  const hasChildren = (region.children?.length || 0) > 0;
  const indentPx = meta.indent * 20;

  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors"
        style={{ marginLeft: `${indentPx}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className={`w-5 h-5 flex items-center justify-center text-gray-400
            ${hasChildren ? 'visible' : 'invisible'}`}
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {/* Icon */}
        {region.is_group
          ? <Layers className={`w-4 h-4 shrink-0 ${meta.color}`} />
          : <MapPin className={`w-4 h-4 shrink-0 ${meta.color}`} />
        }

        {/* Name or edit form */}
        {editing ? (
          <EditRegionForm
            region={region}
            onSave={() => { setEditing(false); onRefresh(); }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium text-enb-text-primary truncate">
              {region.name}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0
              ${region.is_group ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>
              {region.is_group ? 'Group' : meta.label}
            </span>
            {!region.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 font-medium">
                Inactive
              </span>
            )}
          </div>
        )}

        {/* Actions — visible on hover */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="w-6 h-6 rounded-md hover:bg-gray-200 flex items-center justify-center"
              title="Rename"
            >
              <Pencil className="w-3 h-3 text-gray-400" />
            </button>
            {allowedChildren.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(m => !m)}
                  className="w-6 h-6 rounded-md hover:bg-enb-green/10 flex items-center justify-center"
                  title="Add child"
                >
                  <Plus className="w-3 h-3 text-enb-green" />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 top-7 bg-white rounded-xl border border-gray-100
                    shadow-lg z-10 min-w-[220px] py-1">
                    {allowedChildren.map(child => (
                      <button
                        key={child.level}
                        onClick={() => {
                          setAddingChild(child);
                          setShowAddMenu(false);
                          setExpanded(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-enb-text-primary
                          hover:bg-gray-50 flex items-center gap-2"
                      >
                        {child.is_group
                          ? <Layers className="w-3.5 h-3.5 text-purple-500" />
                          : <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        }
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add child form */}
      {addingChild && (
        <div style={{ marginLeft: `${indentPx}px` }}>
          <AddRegionForm
            parentId={region.id}
            level={addingChild.level}
            isGroup={addingChild.is_group}
            label={addingChild.label}
            onSave={() => { setAddingChild(null); onRefresh(); }}
            onCancel={() => setAddingChild(null)}
          />
        </div>
      )}

      {/* Children */}
      {expanded && region.children?.map(child => (
        <RegionNode key={child.id} region={child} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export default function RegionsTab() {
  const [tree, setTree] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchRegions = useCallback(async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('level')
      .order('name');
    if (error) { console.error(error); return; }
    setTree(buildTree(data || []));
    setLoading(false);
  }, []);

  useEffect(() => { fetchRegions(); }, [fetchRegions]);

  // Flat search results
  const flatSearch = search.trim().length >= 2;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-enb-text-primary">Geographic Regions</h2>
          <p className="text-xs text-enb-text-secondary mt-0.5">
            Build the regional hierarchy — Country → Province → City Group → City → Neighbourhood
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search regions..."
        className="w-full text-sm px-4 py-2.5 rounded-xl border border-gray-200 bg-white
          outline-none focus:border-enb-green text-enb-text-primary"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(LEVEL_META).map(([level, meta]) => (
          <div key={level} className="flex items-center gap-1">
            <MapPin className={`w-3 h-3 ${meta.color}`} />
            <span className="text-xs text-enb-text-secondary">{meta.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <Layers className="w-3 h-3 text-purple-500" />
          <span className="text-xs text-enb-text-secondary">Group/Cluster</span>
        </div>
      </div>

      {/* Tree */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-enb-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tree.length === 0 ? (
          <p className="text-center text-sm text-enb-text-secondary py-8">No regions yet.</p>
        ) : (
          tree.map(region => (
            <RegionNode key={region.id} region={region} onRefresh={fetchRegions} />
          ))
        )}
      </div>

      <p className="text-xs text-enb-text-secondary px-1">
        💡 Hover over any region to rename it or add children. Groups (clusters) can contain multiple cities or neighbourhoods.
      </p>
    </div>
  );
}
