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
 * Generates next OVR ID for given year
 * @param year - Year to generate ID for (defaults to current year)
 * @returns Formatted OVR ID (e.g., "OVR-2025-001")
 */
export async function generateOVRId(year?: number): Promise<string> {
    const targetYear = year ?? new Date().getFullYear();

    // Get count of reports for this year
    const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(ovrReports)
        .where(sql`${ovrReports.id} LIKE ${`OVR-${targetYear}-%`}`);

    const count = Number(result[0]?.count ?? 0);
    const nextSequence = count + 1;

    return formatOVRId(targetYear, nextSequence);
}

/**
 * Formats OVR ID with year and sequence number
 * @param year - Year (4 digits)
 * @param sequence - Sequence number (zero-padded to 3 digits)
 * @returns Formatted ID (e.g., "OVR-2025-001")
 */
export function formatOVRId(year: number, sequence: number): string {
    const paddedSequence = String(sequence).padStart(3, '0');
    return `OVR-${year}-${paddedSequence}`;
}

/**
 * Parses OVR ID into components
 * @param id - OVR ID string (e.g., "OVR-2025-001")
 * @returns Object with year and sequence, or null if invalid
 */
export function parseOVRId(id: string): { year: number; sequence: number } | null {
    const match = id.match(/^OVR-(\d{4})-(\d{3})$/);
    if (!match) return null;

    return {
        year: parseInt(match[1]),
        sequence: parseInt(match[2]),
    };
}

/**
 * Validates OVR ID format
 * @param id - String to validate
 * @returns true if valid OVR ID format
 */
export function isValidOVRId(id: string): boolean {
    return /^OVR-\d{4}-\d{3}$/.test(id);
}
