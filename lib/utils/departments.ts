/**
 * @fileoverview Department utility functions
 * 
 * Includes code generation and validation helpers for departments.
 */

/**
 * Generates a unique department code from a department name.
 * 
 * Algorithm:
 * 1. Take the first letter of each word (up to 3 words), uppercase
 * 2. If collision exists, append incrementing number (ED -> ED2 -> ED3...)
 * 
 * @example
 * generateDepartmentCode("Emergency Department", []) // "ED"
 * generateDepartmentCode("Intensive Care Unit", []) // "ICU"
 * generateDepartmentCode("Emergency Department", ["ED"]) // "ED2"
 * generateDepartmentCode("Medical", []) // "MED"
 * 
 * @param name - The department name to generate code from
 * @param existingCodes - Array of existing codes to check for collisions
 * @returns A unique department code
 */
export function generateDepartmentCode(name: string, existingCodes: string[]): string {
    if (!name || !name.trim()) return '';

    // Normalize existing codes to uppercase for comparison
    const normalizedExisting = new Set(existingCodes.map(c => c.toUpperCase()));

    // Split name into words and filter out common words
    const words = name
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
        .filter(word => !['and', 'or', 'the', 'of', 'for', 'in', 'on', 'at', 'to'].includes(word.toLowerCase()));

    let baseCode: string;

    if (words.length === 1) {
        // Single word: take first 3 characters (or less if word is shorter)
        baseCode = words[0].substring(0, 3).toUpperCase();
    } else {
        // Multiple words: take first letter of each word (max 3 words)
        baseCode = words
            .slice(0, 3)
            .map(word => word[0])
            .join('')
            .toUpperCase();
    }

    // If no collision, return base code
    if (!normalizedExisting.has(baseCode)) {
        return baseCode;
    }

    // Handle collision by appending incrementing number
    let counter = 2;
    let candidateCode = `${baseCode}${counter}`;

    while (normalizedExisting.has(candidateCode)) {
        counter++;
        candidateCode = `${baseCode}${counter}`;

        // Safety limit to prevent infinite loop
        if (counter > 99) {
            throw new Error(`Unable to generate unique code for "${name}" after 99 attempts`);
        }
    }

    return candidateCode;
}

/**
 * Validates a department code format.
 * 
 * @param code - The code to validate
 * @returns true if valid, false otherwise
 */
export function isValidDepartmentCode(code: string): boolean {
    if (!code || typeof code !== 'string') return false;

    // Code should be 1-20 characters, alphanumeric only
    const codeRegex = /^[A-Z0-9]{1,20}$/;
    return codeRegex.test(code.toUpperCase());
}
