/**
 * Utility for generating OVR report IDs
 * Format: OVR-YYYY-NNN (e.g., OVR-2025-001)
 * 
 * DRY principle: Single source of truth for ID generation logic
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Generates next OVR ID for given year and month
 * @param year - Year to generate ID for (defaults to current year)
 * @param month - Month to generate ID for (defaults to current month, 1-based)
 * @returns Formatted OVR ID (e.g., "OVR-2025-01-001")
 */
export async function generateOVRId(year?: number, month?: number): Promise<string> {
    const targetYear = year ?? new Date().getFullYear();
    const targetMonth = month ?? new Date().getMonth() + 1;
    const paddedMonth = String(targetMonth).padStart(2, '0');

    // Get count of reports for this year and month
    const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(ovrReports)
        .where(sql`${ovrReports.id} LIKE ${`OVR-${targetYear}-${paddedMonth}-%`}`);

    const count = Number(result[0]?.count ?? 0);
    const nextSequence = count + 1;

    return formatOVRId(targetYear, targetMonth, nextSequence);
}

/**
 * Formats OVR ID with year, month, and sequence number
 * @param year - Year (4 digits)
 * @param month - Month (1-12)
 * @param sequence - Sequence number (zero-padded to 3 digits)
 * @returns Formatted ID (e.g., "OVR-2025-01-001")
 */
export function formatOVRId(year: number, month: number, sequence: number): string {
    const paddedMonth = String(month).padStart(2, '0');
    const paddedSequence = String(sequence).padStart(3, '0');
    return `OVR-${year}-${paddedMonth}-${paddedSequence}`;
}

/**
 * Parses OVR ID into components
 * @param id - OVR ID string (e.g., "OVR-2025-01-001")
 * @returns Object with year, month, and sequence, or null if invalid
 */
export function parseOVRId(id: string): { year: number; month: number; sequence: number } | null {
    const match = id.match(/^OVR-(\d{4})-(\d{2})-(\d{3})$/);
    if (!match) return null;

    return {
        year: parseInt(match[1]),
        month: parseInt(match[2]),
        sequence: parseInt(match[3]),
    };
}

/**
 * Validates OVR ID format
 * @param id - String to validate
 * @returns true if valid OVR ID format
 */
export function isValidOVRId(id: string): boolean {
    return /^OVR-\d{4}-\d{2}-\d{3}$/.test(id);
}
