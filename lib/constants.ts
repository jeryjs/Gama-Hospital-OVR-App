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
 * Uses Group Object IDs (not display names) for reliable mapping
 * Update these IDs to match your Azure AD security groups
 */
export const AD_GROUP_ROLE_MAP: Record<string, AppRole[]> = {
    // System Administration
    '73a2c9f3-9282-4b99-be01-2813c93a5458': [APP_ROLES.SUPER_ADMIN], // SG-OVR-SuperAdmins
    '3909b6bd-c691-4d60-888c-a6a9c7dc4cef': [APP_ROLES.TECH_ADMIN],   // SG-OVR-TechAdmins
    '0407bc66-a177-4a36-981a-c8109da6d7a7': [APP_ROLES.DEVELOPER],    // SG-OVR-Developers

    // Executive Leadership
    'CEO_GROUP_ID_PLACEHOLDER': [APP_ROLES.CEO],
    'cbbffd0f-7b17-4e8b-93d4-9f9f4e5f0b1f': [APP_ROLES.EXECUTIVE],    // SG-OVR-Executives

    // Quality & Safety
    '42e686a5-1f6a-46bd-98e3-cdb19020a999': [APP_ROLES.QUALITY_MANAGER], // SG-OVR-QualityManagers
    'QUALITY_ANALYST_GROUP_ID_PLACEHOLDER': [APP_ROLES.QUALITY_ANALYST],

    // Department Management
    'fd2f96d7-072e-4941-ab27-59505db59c39': [APP_ROLES.DEPARTMENT_HEAD],    // SG-OVR-DepartmentHeads
    '8149fa15-e119-4d5e-a97b-1a68e71fd0bd': [APP_ROLES.ASSISTANT_DEPT_HEAD], // SG-OVR-AssistantHeads

    // Team Management
    '6ed1d31f-e276-46ae-8bb3-da64c9efb8fe': [APP_ROLES.SUPERVISOR], // SG-OVR-Supervisors
    'TEAM_LEAD_GROUP_ID_PLACEHOLDER': [APP_ROLES.TEAM_LEAD],

    // Specialized Roles
    '437034f5-9a13-4d2d-b09a-30b454376f87': [APP_ROLES.FACILITY_MANAGER], // SG-OVR-FacilityManagers

    // Standard Access
    '677b3153-3137-47a0-8823-68b5eb3c1fa4': [APP_ROLES.EMPLOYEE], // SG-OVR-Employees
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

export interface SentinelEvent {
    category: string;
    events: { value: string; label: string }[];
}

export const SENTINEL_EVENTS: SentinelEvent[] = [
    {
        category: "Surgical/Procedure-Related", events: [
            { value: "wrong_site_surgery", label: "Surgery/invasive procedure performed at the wrong site, on the wrong patient, or the wrong procedure." },
            { value: "retained_foreign_object", label: "Unintended retention of a foreign object in a patient after a surgical/invasive procedure." },
            { value: "asa_class1_death", label: "Intraoperative or immediately postoperative/post-procedure death in an ASA Class I patient." },
        ]
    },
    {
        category: "Medication & Transfusion", events: [
            { value: "medication_error_severe", label: "Medication error leading to death, permanent, or severe temporary harm." },
            { value: "incompatible_transfusion", label: "Administration of incompatible ABO, Non-ABO of blood/blood products, or transplantation of incompatible organs." },
            { value: "contaminated_transfusion", label: "Transfusing/transplantation of contaminated blood, blood products, organ, or tissue." },
        ]
    },
    {
        category: "Maternal & Neonatal", events: [
            { value: "neonatal_harm", label: "Neonatal death, permanent or severe temporary harm." },
            { value: "wrong_discharge_newborn", label: "Infant discharged to the wrong family." },
            { value: "patient_abduction", label: "Abduction of any patient (including infants) receiving care." },
            { value: "neonatal_hyperbilirubinemia", label: "Death or serious disability associated with failure to manage/identify neonatal hyperbilirubinemia." },
        ]
    },
    {
        category: "Patient Harm/Injury", events: [
            { value: "unexpected_death_or_harm", label: "Unexpected death, permanent, or severe temporary harm (not primarily related to the natural course of the illness)." },
            { value: "loss_of_limb", label: "Unexpected loss of a limb or function." },
            { value: "patient_fall_severe", label: "Patient death, permanent harm, or severe temporary harm as a result of patient fall." },
            { value: "pressure_injury", label: "Any (stage 3, 4, or unstageable) healthcare facility-acquired pressure injury (ulcer)." },
            { value: "accidental_burn", label: "Accidental burn of second degree and above during patient care." },
            { value: "vte_harm", label: "Patient death, permanent or severe temporary harm associated with venous thromboembolism (VTE)." },
            { value: "patient_suicide", label: "Suicide, attempted suicide, or self-harm that results in severe, temporary harm, permanent harm, or death while being cared for in a healthcare setting or within 72 hours of discharge." },
        ]
    },
    {
        category: "Security & Safety", events: [
            { value: "rape_on_site", label: "Rape of a patient, staff member, or visitor while on-site." },
            { value: "assault_or_homicide", label: "Assault leading to death, permanent harm, or severe, temporary harm, or homicide while on-site." },
            { value: "fire_incident", label: "Fire, flame, or unanticipated smoke or flashes occurring during patient care." },
        ]
    },
    {
        category: "Equipment & Environment", events: [
            { value: "device_failure", label: "Patient death, permanent or severe temporary harm as a result of medical device breakdown or failure when in use." },
            { value: "building_collapse", label: "Unexpected collapse of any building or malfunctioning structure within a healthcare facility." },
        ]
    },
    {
        category: "Other Critical Events", events: [
            { value: "wrong_medical_gas", label: "Patient death, permanent harm, or severe temporary harm associated with wrong administration/connection of medical gas." },
            { value: "transmission_disease", label: "Transmission of disease as a result of using contaminated instruments or equipment." },
            { value: "radiotherapy_error", label: "Delivery of radiotherapy to the wrong body region or a dose that exceeds more than 25% of the total planned dose." },
            { value: "patient_absconded", label: "Unauthorized departure of the patient (absconded) that resulted in death, permanent harm, or severe temporary harm." },
        ]
    }
];

/**
 * Severity levels with display labels and colors
 * Values derived from database schema enum
 */
export const SEVERITY_LEVELS = [
    { value: "", label: "Not Specified", color: "#6B7280" },
    { value: 'near_miss', label: 'Near Miss (Level 1)', color: '#10B981' },
    { value: 'no_apparent_injury', label: 'No Apparent injury (Level 2)', color: '#3B82F6' },
    { value: 'minor', label: 'Minor (Level 3)', color: '#F59E0B' },
    { value: 'major', label: 'Major (Level 4)', color: '#EF4444' },
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

// ============================================
// PHYSICIAN FOLLOW-UP / TREATMENT
// ============================================

export const TREATMENT_TYPES = [
    { value: 'first_aid', label: 'First Aid' },
    { value: 'sutures', label: 'Sutures' },
    { value: 'observation', label: 'Observation' },
    { value: 'bloodwork', label: 'Bloodwork' },
    { value: 'radiology', label: 'Radiology Test' },
    { value: 'hospitalized', label: 'Hospitalized' },
    { value: 'transferred', label: 'Transferred' },
    { value: 'medication', label: 'Medication Given' },
    { value: 'surgery', label: 'Surgery/Procedure' },
    { value: 'consultation', label: 'Specialist Consultation' },
    { value: 'follow_up', label: 'Follow-up Required' },
    { value: 'none', label: 'No Treatment Required' },
    { value: 'icu', label: 'ICU Admission' },
] as const;

// ============================================
// LEVEL OF HARM (Conditional based on category)
// ============================================

/**
 * Level of Harm - Medication-specific (NCC MERP Index A-I)
 * Used when occurrenceCategory === 'medication'
 */
export const MEDICATION_HARM_LEVELS = [
    { value: 'med_a', label: 'A: Circumstances or events that have the capacity to cause error' },
    { value: 'med_b', label: 'B: An error occurred but the error did not reach the patient' },
    { value: 'med_c', label: 'C: An error occurred that reached the patient but did not cause patient harm' },
    { value: 'med_d', label: 'D: An error occurred that reached the patient and required monitoring to confirm that it resulted in no harm to the patient and/or required intervention to preclude harm' },
    { value: 'med_e', label: 'E: An error occurred that may have contributed to, or resulted in temporary harm (minor injury) to the individual and required intervention' },
    { value: 'med_f', label: 'F: An error occurred that may have contributed to, or resulted in temporary harm (minor injury) to the individual and required intervention and initial or prolonged hospitalization' },
    { value: 'med_g', label: 'G: An error occurred that may have contributed to, or resulted in individual harm (serious injury - prolonged the stay or extensive follow up)' },
    { value: 'med_h', label: 'H: An error occurred that resulted in life-threatening injury or multiple serious injuries causing hospitalization and required intervention necessary to sustain life' },
    { value: 'med_i', label: 'I: An error occurred that may have contributed to or resulted in the patient\'s death' },
] as const;

/**
 * Level of Harm - General (for all non-medication incidents)
 */
export const GENERAL_HARM_LEVELS = [
    { value: 'near_miss', label: 'Near Miss: An error occurred but did not reach the patient' },
    { value: 'none', label: 'None: Incident occurred with no harm to the patient or person involved' },
    { value: 'minor', label: 'Minor: No change in vital signs. Non-invasive diagnostic test required. Increased observation or monitoring required' },
    { value: 'moderate', label: 'Moderate: Vital signs changes. Decreased level of consciousness. Additional medication/treatment required. Invasive diagnostic procedure required' },
    { value: 'major', label: 'Major: Any unexpected or unintended incident that caused permanent or long-term harm to one or more persons' },
    { value: 'catastrophic', label: 'Catastrophic: Incident resulting in death' },
] as const;

/**
 * Get appropriate harm levels based on category (DRY helper)
 */
export function getHarmLevelsForCategory(category: string | undefined): typeof MEDICATION_HARM_LEVELS | typeof GENERAL_HARM_LEVELS {
    return category === 'CAT019'  // Medication
        ? MEDICATION_HARM_LEVELS
        : GENERAL_HARM_LEVELS;
}

// ============================================
// RISK CLASSIFICATION MATRIX (DRY)
// ============================================

/**
 * Risk Impact Levels (1-5) - Severity of consequences
 */
export const RISK_IMPACT_LEVELS = [
    { value: 1, label: 'Negligible', color: '#4CAF50' },
    { value: 2, label: 'Minor', color: '#8BC34A' },
    { value: 3, label: 'Moderate', color: '#FFC107' },
    { value: 4, label: 'Major', color: '#FF9800' },
    { value: 5, label: 'Catastrophic', color: '#F44336' },
] as const;

/**
 * Risk Likelihood Levels (1-5) - Probability of occurrence
 */
export const RISK_LIKELIHOOD_LEVELS = [
    { value: 1, label: 'Rare' },
    { value: 2, label: 'Unlikely' },
    { value: 3, label: 'Possible' },
    { value: 4, label: 'Likely' },
    { value: 5, label: 'Almost Certain' },
] as const;

/**
 * Risk Matrix - Programmatically generated (DRY)
 * Returns 5x5 matrix of risk scores (impact × likelihood)
 */
export const RISK_MATRIX = Array.from({ length: 5 }, (_, impactIdx) =>
    Array.from({ length: 5 }, (_, likelihoodIdx) => {
        const impact = 5 - impactIdx; // Reverse for display (5 at top)
        const likelihood = likelihoodIdx + 1; // 1-5 left to right
        return impact * likelihood;
    })
);

/**
 * Risk Levels - Color-coded zones based on score
 * DRY: Single source of truth for risk level logic
 */
export const RISK_LEVELS = [
    {
        level: 'green',
        label: 'Low Risk',
        range: [1, 3] as const,
        color: '#4CAF50',
        bgColor: '#E8F5E9'
    },
    {
        level: 'yellow',
        label: 'Moderate Risk',
        range: [4, 6] as const,
        color: '#FFC107',
        bgColor: '#FFF9C4'
    },
    {
        level: 'amber',
        label: 'High Risk',
        range: [8, 12] as const,
        color: '#FF9800',
        bgColor: '#FFE0B2'
    },
    {
        level: 'red',
        label: 'Extreme Risk',
        range: [15, 25] as const,
        color: '#F44336',
        bgColor: '#FFCDD2'
    },
] as const;

/**
 * Calculate risk level from score (DRY helper)
 */
export function getRiskLevel(score: number): typeof RISK_LEVELS[number] {
    return RISK_LEVELS.find(level =>
        score >= level.range[0] && score <= level.range[1]
    ) || RISK_LEVELS[0];
}

/**
 * Calculate risk score from impact and likelihood (DRY helper)
 */
export function calculateRiskScore(impact: number, likelihood: number): number {
    return impact * likelihood;
}
