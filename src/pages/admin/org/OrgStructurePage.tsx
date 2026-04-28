// src/pages/admin/org/OrgStructurePage.tsx
// ENB Org Structure — Super Admin organizational management
// Tabs: Regions → Departments → Roles → Members

import { useState } from 'react';
import { Map, Building2, Shield, Users } from 'lucide-react';
import RegionsTab from './RegionsTab';
import DepartmentsTab from './DepartmentsTab';
import RolesTab from './RolesTab';
import MembersTab from './MembersTab';

const TABS = [
  {
    id: 'regions',
    label: 'Regions',
    icon: Map,
    description: 'Geographic hierarchy',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    activeBg: 'bg-blue-600',
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: Building2,
    description: 'Functional domains',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    activeBg: 'bg-purple-600',
  },
  {
    id: 'roles',
    label: 'Roles',
    icon: Shield,
    description: 'Permissions & roles',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    activeBg: 'bg-amber-600',
  },
  {
    id: 'members',
    label: 'Members',
    icon: Users,
    description: 'Assign people',
    color: 'text-enb-green',
    bg: 'bg-enb-green/10',
    activeBg: 'bg-enb-green',
  },
] as const;

type TabId = typeof TABS[number]['id'];

export default function OrgStructurePage() {
  const [activeTab, setActiveTab] = useState<TabId>('regions');
  const active = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6 pb-24">

      {/* Page header */}
      <header>
        <h1 className="text-2xl font-bold text-enb-text-primary">Org Structure</h1>
        <p className="text-enb-text-secondary text-sm mt-0.5">
          Build the geographic and functional backbone of Eco-Neighbor
        </p>
      </header>

      {/* Tab bar — card grid on mobile, horizontal on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map((tab, i) => {
          const isActive = tab.id === activeTab;
          // Show a step number to reinforce ground-up order
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left
                ${isActive
                  ? 'bg-enb-text-primary border-transparent shadow-md'
                  : 'bg-white border-gray-100 shadow-sm hover:border-gray-200 hover:shadow'
                }`}
            >
              {/* Step badge */}
              <span className={`absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                ${isActive ? 'bg-white/15' : tab.bg}`}>
                <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.color}`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-enb-text-primary'}`}>
                  {tab.label}
                </p>
                <p className={`text-xs ${isActive ? 'text-white/70' : 'text-enb-text-secondary'}`}>
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active tab content */}
      <div>
        {activeTab === 'regions'     && <RegionsTab />}
        {activeTab === 'departments' && <DepartmentsTab />}
        {activeTab === 'roles'       && <RolesTab />}
        {activeTab === 'members'     && <MembersTab />}
      </div>
    </div>
  );
}
