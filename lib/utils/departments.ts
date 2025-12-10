/**
 * @fileoverview Department utility functions
 * 
 * Includes code generation helpers for departments.
 * Department codes are INTERNAL ONLY - never shown to users.
 */

/**
 * Generate internal department code.
 * Format: 3 chars from name + 4 random alphanumeric chars
 * 
 * @example
 * generateDepartmentCode("Emergency Department") // "emer7x9z"
 * generateDepartmentCode("ICU") // "icua2b3c"
 * generateDepartmentCode("X") // "xxx4k8m2"
 * 
 * @param name - The department name to generate code from
 * @returns A unique internal department code (always 7 chars)
 */
export function generateDepartmentCode(name: string): string {
    if (!name || !name.trim()) return '';

    // Get first 3 chars from cleaned name (lowercase, no spaces/special chars)
    const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
    const prefix = cleanName.slice(0, 3).padEnd(3, 'x');

    // Generate 4 random alphanumeric chars
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const random = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    return `${prefix}${random}`;
}
