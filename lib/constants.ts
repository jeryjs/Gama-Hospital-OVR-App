/**
 * Shared constants for the OVR application
 * Single source of truth for roles, permissions, and access control
 */

import { injuryOutcomeEnum, personInvolvedEnum, severityLevelEnum } from '@/db/schema';

// ============================================
// ROLES & PERMISSIONS
// ============================================

/**
 * Application roles - used for authorization throughout the app
 */
export const APP_ROLES = {
    // System Administration
    SUPER_ADMIN: 'super_admin',
    TECH_ADMIN: 'tech_admin',
    DEVELOPER: 'developer',

    // Executive Leadership
    CEO: 'ceo',
    EXECUTIVE: 'executive',

    // Quality & Safety
    QUALITY_MANAGER: 'quality_manager',
    QUALITY_ANALYST: 'quality_analyst',

    // Department Management
    DEPARTMENT_HEAD: 'department_head',
    ASSISTANT_DEPT_HEAD: 'assistant_dept_head',

    // Team Management
    SUPERVISOR: 'supervisor',
    TEAM_LEAD: 'team_lead',

    // Specialized Roles
    FACILITY_MANAGER: 'facility_manager',

    // Standard Access
    EMPLOYEE: 'employee',
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

/**
 * Role priority order (highest to lowest)
 * Used for determining primary role when user has multiple roles
 */
export const ROLE_PRIORITY: AppRole[] = [
    APP_ROLES.SUPER_ADMIN,
    APP_ROLES.DEVELOPER,
    APP_ROLES.CEO,
    APP_ROLES.EXECUTIVE,
    APP_ROLES.TECH_ADMIN,
    APP_ROLES.QUALITY_MANAGER,
    APP_ROLES.QUALITY_ANALYST,
    APP_ROLES.DEPARTMENT_HEAD,
    APP_ROLES.ASSISTANT_DEPT_HEAD,
    APP_ROLES.SUPERVISOR,
    APP_ROLES.TEAM_LEAD,
    APP_ROLES.FACILITY_MANAGER,
    APP_ROLES.EMPLOYEE,
];

/**
 * Role metadata for UI display
 */
export const ROLE_METADATA: Record<AppRole, { label: string; color: string; description: string }> = {
    [APP_ROLES.SUPER_ADMIN]: { label: 'Super Admin', color: '#DC2626', description: 'Full system access' },
    [APP_ROLES.TECH_ADMIN]: { label: 'Tech Admin', color: '#7C3AED', description: 'System management access' },
    [APP_ROLES.DEVELOPER]: { label: 'Developer', color: '#059669', description: 'Development and testing access' },
    [APP_ROLES.CEO]: { label: 'CEO', color: '#1E40AF', description: 'Executive oversight' },
    [APP_ROLES.EXECUTIVE]: { label: 'Executive', color: '#4F46E5', description: 'Executive level access' },
    [APP_ROLES.QUALITY_MANAGER]: { label: 'Quality Manager', color: '#8B5CF6', description: 'QI workflow management' },
    [APP_ROLES.QUALITY_ANALYST]: { label: 'Quality Analyst', color: '#A78BFA', description: 'Quality assurance support' },
    [APP_ROLES.DEPARTMENT_HEAD]: { label: 'Department Head', color: '#EC4899', description: 'Department leadership' },
    [APP_ROLES.ASSISTANT_DEPT_HEAD]: { label: 'Assistant Head', color: '#F472B6', description: 'Department support' },
    [APP_ROLES.SUPERVISOR]: { label: 'Supervisor', color: '#3B82F6', description: 'Team supervision' },
    [APP_ROLES.TEAM_LEAD]: { label: 'Team Lead', color: '#60A5FA', description: 'Team coordination' },
    [APP_ROLES.FACILITY_MANAGER]: { label: 'Facility Manager', color: '#F59E0B', description: 'Facility management' },
    [APP_ROLES.EMPLOYEE]: { label: 'Employee', color: '#6B7280', description: 'Standard user access' },
};

/**
 * Azure AD Security Group to App Role mapping
 * Update these group names to match your Azure AD configuration
 */
export const AD_GROUP_ROLE_MAP: Record<string, AppRole[]> = {
    'SG-OVR-SuperAdmins': [APP_ROLES.SUPER_ADMIN],
    'SG-OVR-TechAdmins': [APP_ROLES.TECH_ADMIN],
    'SG-OVR-Developers': [APP_ROLES.DEVELOPER],
    'SG-OVR-CEO': [APP_ROLES.CEO],
    'SG-OVR-Executives': [APP_ROLES.EXECUTIVE],
    'SG-OVR-QualityManagers': [APP_ROLES.QUALITY_MANAGER],
    'SG-OVR-QualityAnalysts': [APP_ROLES.QUALITY_ANALYST],
    'SG-OVR-DepartmentHeads': [APP_ROLES.DEPARTMENT_HEAD],
    'SG-OVR-AssistantHeads': [APP_ROLES.ASSISTANT_DEPT_HEAD],
    'SG-OVR-Supervisors': [APP_ROLES.SUPERVISOR],
    'SG-OVR-TeamLeads': [APP_ROLES.TEAM_LEAD],
    'SG-OVR-FacilityManagers': [APP_ROLES.FACILITY_MANAGER],
    'SG-OVR-Employees': [APP_ROLES.EMPLOYEE],
};

// ============================================
// OVR FORM CONSTANTS (WITH UI METADATA)
// ============================================

// Extract values directly from schema enums
export const INJURY_OUTCOME_VALUES = injuryOutcomeEnum.enumValues;
export const PERSON_INVOLVED_VALUES = personInvolvedEnum.enumValues;
export const SEVERITY_LEVEL_VALUES = severityLevelEnum.enumValues;

/**
 * Injury outcomes with display labels
 * Values derived from database schema enum
 */
export const INJURY_OUTCOMES = [
    { value: '', label: 'Not Specified' },
    { value: 'no_injury', label: 'No Injury' },
    { value: 'minor', label: 'Minor' },
    { value: 'serious', label: 'Serious' },
    { value: 'death', label: 'Death' },
] as const satisfies ReadonlyArray<{ value: typeof INJURY_OUTCOME_VALUES[number]; label: string }>;
/**
 * Person involved options with display labels
 * Values derived from database schema enum
 */
export const PERSON_INVOLVED_OPTIONS = [
    { value: 'patient', label: 'Patient' },
    { value: 'staff', label: 'Staff' },
    { value: 'visitor_watcher', label: 'Visitor/ Watcher' },
    { value: 'others', label: 'Others' },
] as const satisfies ReadonlyArray<{ value: typeof PERSON_INVOLVED_VALUES[number]; label: string }>;

/**
 * Severity levels with display labels and colors
 * Values derived from database schema enum
 */
export const SEVERITY_LEVELS = [
    { value: "", label: "Not Specified", color: "#6B7280" },
    { value: 'near_miss_level_1', label: 'Near Miss (Level 1)', color: '#10B981' },
    { value: 'no_apparent_injury_level_2', label: 'No Apparent injury (Level 2)', color: '#3B82F6' },
    { value: 'minor_level_3', label: 'Minor (Level 3)', color: '#F59E0B' },
    { value: 'major_level_4', label: 'Major (Level 4)', color: '#EF4444' },
] as const satisfies ReadonlyArray<{ value: typeof SEVERITY_LEVEL_VALUES[number]; label: string; color: string }>;

/**
 * Helper to get severity level label from value
 */
export function getSeverityLabel(value: string | null | undefined): string {
    if (!value) return 'N/A';
    return SEVERITY_LEVELS.find(s => s.value === value)?.label || value;
}

export interface CauseClassification {
    id: string;
    label: string;
}

export const CAUSE_CLASSIFICATIONS: CauseClassification[] = [
    { id: '1', label: 'Absence of Policy' },
    { id: '2', label: 'Policy not Implemented' },
    { id: '3', label: 'Lack of Understanding' },
    { id: '4', label: 'Lack of Communication' },
    { id: '5', label: 'Negligence' },
    { id: '6', label: 'Materials / supply shortage' },
    { id: '7', label: 'Materials / Supply poor quality' },
    { id: '8', label: 'Shortage of Equipment' },
    { id: '9', label: 'Equipment Malfunction' },
    { id: '10', label: 'Others (Specify)' },
];
