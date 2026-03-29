/**
 * @fileoverview Turnaround Utilities
 *
 * Centralized SLA turnaround helpers derived from latest levelOfHarm.
 * Working-day rules (per policy notes):
 * - Yellow/Green zone: 5 working days
 * - Amber zone: 15 working days
 * - Red zone: 30 working days
 */

export type TurnaroundZone = 'green_yellow' | 'amber' | 'red';

export type TurnaroundStatus = 'untracked' | 'on_track' | 'due_soon' | 'overdue';

export interface TurnaroundRule {
    zone: TurnaroundZone;
    zoneLabel: string;
    workingDays: number;
}

export interface TurnaroundIncidentInput {
    levelOfHarm?: string | null;
    submittedAt?: string | Date | null;
    createdAt?: string | Date | null;
}

export interface IncidentTurnaround {
    tracked: boolean;
    status: TurnaroundStatus;
    levelOfHarm: string | null;
    zone: TurnaroundZone | null;
    zoneLabel: string | null;
    workingDays: number | null;
    anchorDate: Date | null;
    dueDate: Date | null;
    remainingWorkingDays: number | null;
}

export interface TurnaroundSummary {
    tracked: number;
    overdue: number;
    dueSoon: number;
    onTrack: number;
}

const WEEKEND_DAYS = new Set([5, 6]); // Friday (5), Saturday (6)

const ZONE_RULES: Record<TurnaroundZone, TurnaroundRule> = {
    green_yellow: {
        zone: 'green_yellow',
        zoneLabel: 'Yellow/Green Risk Zone',
        workingDays: 5,
    },
    amber: {
        zone: 'amber',
        zoneLabel: 'Amber Risk Zone',
        workingDays: 15,
    },
    red: {
        zone: 'red',
        zoneLabel: 'Red Risk Zone',
        workingDays: 30,
    },
};

const LEVEL_OF_HARM_TO_ZONE: Record<string, TurnaroundZone> = {
    near_miss: 'green_yellow',
    none: 'green_yellow',
    minor: 'green_yellow',
    med_a: 'green_yellow',
    med_b: 'green_yellow',
    med_c: 'green_yellow',
    med_d: 'green_yellow',

    moderate: 'amber',
    med_e: 'amber',
    med_f: 'amber',

    major: 'red',
    catastrophic: 'red',
    med_g: 'red',
    med_h: 'red',
    med_i: 'red',
};

function toDate(value: string | Date | null | undefined): Date | null {
    if (!value) return null;

    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date;
}

function startOfDay(date: Date): Date {
    const normalized = new Date(date.getTime());
    normalized.setHours(0, 0, 0, 0);
    return normalized;
}

function isWorkingDay(date: Date): boolean {
    return !WEEKEND_DAYS.has(date.getDay());
}

/**
 * Adds working days to a date.
 * Note: the anchor date itself is not counted as day 1.
 */
export function addWorkingDays(anchorDate: Date, workingDays: number): Date {
    const safeDays = Math.max(0, Math.trunc(workingDays));
    const result = startOfDay(anchorDate);

    let remaining = safeDays;
    while (remaining > 0) {
        result.setDate(result.getDate() + 1);
        if (isWorkingDay(result)) {
            remaining -= 1;
        }
    }

    return result;
}

/**
 * Returns working-day difference from startDate -> endDate.
 * Positive: endDate is in the future; negative: already overdue.
 */
export function getWorkingDaysDifference(startDate: Date, endDate: Date): number {
    const cursor = startOfDay(startDate);
    const target = startOfDay(endDate);

    if (cursor.getTime() === target.getTime()) return 0;

    const direction = cursor.getTime() < target.getTime() ? 1 : -1;
    let diff = 0;

    while (cursor.getTime() !== target.getTime()) {
        cursor.setDate(cursor.getDate() + direction);
        if (isWorkingDay(cursor)) {
            diff += direction;
        }
    }

    return diff;
}

export function getTurnaroundRule(levelOfHarm: string | null | undefined): TurnaroundRule | null {
    if (!levelOfHarm) return null;

    const zone = LEVEL_OF_HARM_TO_ZONE[levelOfHarm];
    if (!zone) return null;

    return ZONE_RULES[zone];
}

export function getIncidentTurnaround(
    incident: TurnaroundIncidentInput,
    now: Date = new Date()
): IncidentTurnaround {
    const levelOfHarm = incident.levelOfHarm || null;
    const rule = getTurnaroundRule(levelOfHarm);
    const anchorDate = toDate(incident.submittedAt) || toDate(incident.createdAt);

    if (!rule || !anchorDate) {
        return {
            tracked: false,
            status: 'untracked',
            levelOfHarm,
            zone: null,
            zoneLabel: null,
            workingDays: null,
            anchorDate,
            dueDate: null,
            remainingWorkingDays: null,
        };
    }

    const dueDate = addWorkingDays(anchorDate, rule.workingDays);
    dueDate.setHours(23, 59, 59, 999);

    const remainingWorkingDays = getWorkingDaysDifference(now, dueDate);
    const status: TurnaroundStatus =
        remainingWorkingDays < 0
            ? 'overdue'
            : remainingWorkingDays <= 2
                ? 'due_soon'
                : 'on_track';

    return {
        tracked: true,
        status,
        levelOfHarm,
        zone: rule.zone,
        zoneLabel: rule.zoneLabel,
        workingDays: rule.workingDays,
        anchorDate,
        dueDate,
        remainingWorkingDays,
    };
}

export function summarizeTurnaround(incidents: TurnaroundIncidentInput[]): TurnaroundSummary {
    const summary: TurnaroundSummary = {
        tracked: 0,
        overdue: 0,
        dueSoon: 0,
        onTrack: 0,
    };

    incidents.forEach((incident) => {
        const turnaround = getIncidentTurnaround(incident);
        if (!turnaround.tracked) return;

        summary.tracked += 1;

        if (turnaround.status === 'overdue') {
            summary.overdue += 1;
            return;
        }

        if (turnaround.status === 'due_soon') {
            summary.dueSoon += 1;
            return;
        }

        if (turnaround.status === 'on_track') {
            summary.onTrack += 1;
        }
    });

    return summary;
}
