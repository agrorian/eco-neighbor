// src/hooks/useOrgPermissions.ts
// Universal permission hook — checks a user's org role permissions
// Usage: const { can, isInDept, isInRegion, memberships, loading } = useOrgPermissions()

import { useState, useEffect, useCallback } from 'react';
import { supabase, getDb } from '@/lib/supabase';
import { useUserStore, isSuperAdmin as checkSuperAdmin } from '@/store/user';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Permission =
  // Communication
  | 'can_post_announcements'
  | 'can_add_members'
  | 'can_remove_members'
  | 'can_create_channels'
  // Management
  | 'can_assign_roles'
  | 'can_view_reports'
  // Moderation
  | 'can_moderate_content'
  | 'can_audit'
  | 'can_investigate'
  // Community Food Guardian
  | 'can_manage_food_hub'
  | 'can_log_safety_checks'
  | 'can_register_priority_recipients'
  | 'can_log_food_intake'
  | 'can_notify_community'
  | 'can_coordinate_food_runners'
  | 'can_submit_food_flow_data'
  // Governance
  | 'can_create_proposals'
  | 'can_vote_proposals'
  | 'can_vote_financial'
  | 'can_manage_multisig'
  | 'can_view_governance_reports';

export interface OrgMembership {
  id: string;
  department_id: string;
  department_name: string;
  department_icon: string | null;
  region_id: string;
  region_name: string;
  region_level: string;
  org_role_id: string | null;
  org_role_name: string | null;
  permissions: Record<string, boolean>;
}

interface UseOrgPermissionsReturn {
  // Core permission check — does this user have this permission anywhere?
  can: (permission: Permission) => boolean;

  // Scoped permission check — does user have permission in a specific dept/region?
  canIn: (permission: Permission, options: {
    departmentId?: string;
    regionId?: string;
  }) => boolean;

  // Membership checks
  isInDept: (departmentId: string) => boolean;
  isInRegion: (regionId: string) => boolean;
  isInDeptAndRegion: (departmentId: string, regionId: string) => boolean;

  // Get all memberships for this user
  memberships: OrgMembership[];

  // Get memberships filtered by dept or region
  membershipsInDept: (departmentId: string) => OrgMembership[];
  membershipsInRegion: (regionId: string) => OrgMembership[];

  // Get merged permission set across ALL memberships (union of all permissions)
  allPermissions: Record<string, boolean>;

  // Super admin shortcut — SA bypasses all permission checks
  isSuperAdmin: boolean;

  loading: boolean;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrgPermissions(): UseOrgPermissionsReturn {
  const { user } = useUserStore();
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [loading, setLoading] = useState(true);

  // ── ENB DOCTRINE: Always use shared isSuperAdmin() from store ────────────
  // Never check role strings inline. Never hardcode user IDs.
  const isSuperAdmin = checkSuperAdmin(user?.role);

  const fetchMemberships = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    // SA gets everything — no need to fetch
    if (isSuperAdmin) { setLoading(false); return; }

    const { data, error } = await getDb()
      .from('user_org_memberships')
      .select('id, department_id, region_id, org_role_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error || !data?.length) { setLoading(false); return; }

    // Fetch related data in parallel
    const deptIds   = [...new Set(data.map(m => m.department_id))];
    const regionIds = [...new Set(data.map(m => m.region_id))];
    const roleIds   = [...new Set(data.map(m => m.org_role_id).filter(Boolean))];

    const [deptsRes, regionsRes, rolesRes] = await Promise.all([
      getDb().from('departments').select('id, name, icon').in('id', deptIds),
      getDb().from('regions').select('id, name, level').in('id', regionIds),
      roleIds.length
        ? getDb().from('org_roles').select('id, name, permissions').in('id', roleIds)
        : Promise.resolve({ data: [] }),
    ]);

    const deptsMap   = new Map((deptsRes.data   || []).map(d => [d.id, d]));
    const regionsMap = new Map((regionsRes.data  || []).map(r => [r.id, r]));
    const rolesMap   = new Map((rolesRes.data    || []).map(r => [r.id, r]));

    const joined: OrgMembership[] = data.map(m => {
      const dept   = deptsMap.get(m.department_id);
      const region = regionsMap.get(m.region_id);
      const role   = m.org_role_id ? rolesMap.get(m.org_role_id) : null;

      return {
        id:               m.id,
        department_id:    m.department_id,
        department_name:  dept?.name   || 'Unknown',
        department_icon:  dept?.icon   || null,
        region_id:        m.region_id,
        region_name:      region?.name  || 'Unknown',
        region_level:     region?.level || '',
        org_role_id:      m.org_role_id,
        org_role_name:    role?.name    || null,
        permissions:      role?.permissions || {},
      };
    });

    setMemberships(joined);
    setLoading(false);
  }, [user, isSuperAdmin]);

  useEffect(() => { fetchMemberships(); }, [fetchMemberships]);

  // ── Merged permission set across ALL memberships ──────────────────────────
  const allPermissions: Record<string, boolean> = {};
  memberships.forEach(m => {
    Object.entries(m.permissions).forEach(([key, val]) => {
      if (val) allPermissions[key] = true;
    });
  });

  // ── can: does user have this permission in ANY membership? ────────────────
  const can = (permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    return allPermissions[permission] === true;
  };

  // ── canIn: does user have permission in a specific dept and/or region? ────
  const canIn = (
    permission: Permission,
    options: { departmentId?: string; regionId?: string }
  ): boolean => {
    if (isSuperAdmin) return true;
    return memberships.some(m => {
      const deptMatch   = !options.departmentId || m.department_id === options.departmentId;
      const regionMatch = !options.regionId     || m.region_id     === options.regionId;
      return deptMatch && regionMatch && m.permissions[permission] === true;
    });
  };

  // ── Membership helpers ────────────────────────────────────────────────────
  const isInDept = (departmentId: string): boolean => {
    if (isSuperAdmin) return true;
    return memberships.some(m => m.department_id === departmentId);
  };

  const isInRegion = (regionId: string): boolean => {
    if (isSuperAdmin) return true;
    return memberships.some(m => m.region_id === regionId);
  };

  const isInDeptAndRegion = (departmentId: string, regionId: string): boolean => {
    if (isSuperAdmin) return true;
    return memberships.some(
      m => m.department_id === departmentId && m.region_id === regionId
    );
  };

  const membershipsInDept = (departmentId: string): OrgMembership[] =>
    memberships.filter(m => m.department_id === departmentId);

  const membershipsInRegion = (regionId: string): OrgMembership[] =>
    memberships.filter(m => m.region_id === regionId);

  return {
    can,
    canIn,
    isInDept,
    isInRegion,
    isInDeptAndRegion,
    memberships,
    membershipsInDept,
    membershipsInRegion,
    allPermissions,
    isSuperAdmin,
    loading,
    refresh: fetchMemberships,
  };
}
