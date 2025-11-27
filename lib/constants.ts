/**
 * Shared constants for the OVR application
 */

export const INJURY_OUTCOMES = [
    { value: 'no_injury', label: 'No Injury' },
    { value: 'minor', label: 'Minor' },
    { value: 'serious', label: 'Serious' },
    { value: 'death', label: 'Death' },
];

export const PERSON_INVOLVED_OPTIONS = [
    { value: 'patient', label: 'Patient' },
    { value: 'staff', label: 'Staff' },
    { value: 'visitor_watcher', label: 'Visitor/ Watcher' },
    { value: 'others', label: 'Others' },
];

export const SEVERITY_LEVELS = [
    { value: 'near_miss_level_1', label: 'Near Miss (Level 1)', color: '#10B981' },
    { value: 'no_apparent_injury_level_2', label: 'No Apparent injury (Level 2)', color: '#3B82F6' },
    { value: 'minor_level_3', label: 'Minor (Level 3)', color: '#F59E0B' },
    { value: 'major_level_4', label: 'Major (Level 4)', color: '#EF4444' },
];

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
