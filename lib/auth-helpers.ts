/**
 * @fileoverview Centralized authentication and authorization helpers
 * Single source of truth for all role-based access control logic
 */

import { AD_GROUP_ROLE_MAP, APP_ROLES, ROLE_METADATA, ROLE_PRIORITY, type AppRole } from './constants';

// ============================================
// ROLE CHECK FUNCTIONS
// ============================================

/**
 * Check if user has a specific role
 * @example hasRole(['super_admin', 'supervisor'], APP_ROLES.SUPER_ADMIN) // true
 */
export function hasRole(roles: AppRole[] | undefined | null, targetRole: AppRole): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.includes(targetRole);
}

/**
 * Check if user has ANY of the specified roles
 * @example hasAnyRole(['supervisor'], [APP_ROLES.SUPER_ADMIN, APP_ROLES.SUPERVISOR]) // true
 */
export function hasAnyRole(
    roles: AppRole[] | undefined | null,
    targetRoles: AppRole[]
): boolean {
    if (!roles || roles.length === 0) return false;
    if (targetRoles.length === 0) return false;
    return targetRoles.some((role) => roles.includes(role));
}

/**
 * Check if user has ALL of the specified roles
 * @example hasAllRoles(['super_admin', 'developer'], [APP_ROLES.SUPER_ADMIN, APP_ROLES.DEVELOPER]) // true
 */
export function hasAllRoles(
    roles: AppRole[] | undefined | null,
    targetRoles: AppRole[]
): boolean {
    if (!roles || roles.length === 0) return false;
    if (targetRoles.length === 0) return true;
    return targetRoles.every((role) => roles.includes(role));
}

/**
 * Get highest priority role for display purposes
 * @example getPrimaryRole(['employee', 'supervisor', 'super_admin']) // 'super_admin'
 */
export function getPrimaryRole(roles: AppRole[]): AppRole {
    // Import inside function to avoid circular dependency
    for (const role of ROLE_PRIORITY) {
        if (roles.includes(role)) return role;
    }

    return APP_ROLES.EMPLOYEE;
}

// ============================================
// AZURE AD GROUP MAPPING
// ============================================

/**
 * Map Azure AD security groups to application roles
 * Centralized mapping logic - update AD_GROUP_ROLE_MAP in constants.ts
 */
export function mapAdGroupsToRoles(adGroups: string[]): AppRole[] {
    const roleSet = new Set<AppRole>();

    for (const group of adGroups) {
        const mappedRoles = AD_GROUP_ROLE_MAP[group] as AppRole[] | undefined;
        if (mappedRoles) {
            mappedRoles.forEach((role: AppRole) => roleSet.add(role));
        }
    }

    // Always ensure at least 'employee' role
    if (roleSet.size === 0) {
        roleSet.add(APP_ROLES.EMPLOYEE as AppRole);
    }

    return Array.from(roleSet);
}

/**
 * Check if AD groups need refresh (>24 hours old)
 */
export function needsAdSync(lastSync: Date | null | undefined): boolean {
    if (!lastSync) return true;
    const hoursSinceSync = (Date.now() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
    return hoursSinceSync > 24;
}

// ============================================
// ROLE DISPLAY HELPERS
// ============================================

/**
 * Get role metadata for UI display
 */
export function getRoleMetadata(role: AppRole): {
    label: string;
    color: string;
    description: string;
} {
    return (
        ROLE_METADATA[role] || {
            label: role,
            color: '#6B7280',
            description: 'Unknown role',
        }
    );
}

/**
 * Format roles for display (e.g., "Admin, Supervisor")
 */
export function formatRoles(roles: AppRole[]): string {
    if (!roles || roles.length === 0) return 'No roles';
    return roles.map((role) => getRoleMetadata(role).label).join(', ');
}
