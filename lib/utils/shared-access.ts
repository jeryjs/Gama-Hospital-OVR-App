/**
 * @fileoverview Shared Access Helpers
 * 
 * Utilities for managing email-based shared access (Google Forms style)
 * Stores multiple emails as comma-separated values for efficiency
 */

/**
 * Convert array of email addresses to CSV string
 * Validates and normalizes emails before storage
 * 
 * @param emails - Array of email addresses
 * @returns Comma-separated email string
 * @throws Error if any email is invalid
 * 
 * @example
 * emailsToCsv(['john@example.com', 'jane@example.com'])
 * // => "john@example.com,jane@example.com"
 */
export function emailsToCsv(emails: string[]): string {
  if (!emails || emails.length === 0) {
    return '';
  }

  // Validate and normalize emails
  const normalized = emails.map(email => {
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      throw new Error(`Invalid email address: ${email}`);
    }
    return trimmed;
  });

  // Remove duplicates
  const unique = [...new Set(normalized)];

  return unique.join(',');
}

/**
 * Convert CSV string to array of email addresses
 * 
 * @param csv - Comma-separated email string
 * @returns Array of email addresses
 * 
 * @example
 * csvToEmails('john@example.com,jane@example.com')
 * // => ['john@example.com', 'jane@example.com']
 */
export function csvToEmails(csv: string | null | undefined): string[] {
  if (!csv || csv.trim().length === 0) {
    return [];
  }

  return csv
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0);
}

/**
 * Check if email exists in CSV string
 * Case-insensitive comparison
 * 
 * @param csv - Comma-separated email string
 * @param email - Email to check
 * @returns true if email is in the CSV
 */
export function emailExistsInCsv(csv: string | null | undefined, email: string): boolean {
  const emails = csvToEmails(csv);
  const normalized = email.trim().toLowerCase();
  return emails.includes(normalized);
}

/**
 * Add email to CSV string (if not already present)
 * 
 * @param csv - Current CSV string
 * @param email - Email to add
 * @returns Updated CSV string
 */
export function addEmailToCsv(csv: string | null | undefined, email: string): string {
  const emails = csvToEmails(csv);
  const normalized = email.trim().toLowerCase();
  
  if (!isValidEmail(normalized)) {
    throw new Error(`Invalid email address: ${email}`);
  }

  if (!emails.includes(normalized)) {
    emails.push(normalized);
  }

  return emails.join(',');
}

/**
 * Remove email from CSV string
 * 
 * @param csv - Current CSV string
 * @param email - Email to remove
 * @returns Updated CSV string
 */
export function removeEmailFromCsv(csv: string | null | undefined, email: string): string {
  const emails = csvToEmails(csv);
  const normalized = email.trim().toLowerCase();
  
  const filtered = emails.filter(e => e !== normalized);
  return filtered.join(',');
}

/**
 * Basic email validation
 * 
 * @param email - Email address to validate
 * @returns true if email format is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get count of emails in CSV
 * 
 * @param csv - Comma-separated email string
 * @returns Number of emails
 */
export function getEmailCount(csv: string | null | undefined): number {
  return csvToEmails(csv).length;
}
