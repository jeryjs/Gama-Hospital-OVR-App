import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN?.split(',') || ['gamahospital.com'])
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

const ALLOW_ALL_EMAIL_DOMAINS = ALLOWED_DOMAIN.includes('*');

export const STAFF_ID_OTP_TTL_MINUTES = 10;
export const STAFF_ID_OTP_RESEND_COOLDOWN_SECONDS = 60;
export const STAFF_ID_OTP_MAX_ATTEMPTS = 5;
export const STAFF_ID_OTP_MAX_SEND_PER_HOUR = 5;

export function normalizeEmployeeId(value: string): string {
    return value.trim().toLowerCase();
}

export function normalizeEmail(value: string): string {
    return value.trim().toLowerCase();
}

export function isAllowedDomainEmail(email: string): boolean {
    if (ALLOW_ALL_EMAIL_DOMAINS) {
        return true;
    }

    const domain = email.split('@')[1]?.trim().toLowerCase();
    if (!domain) {
        return false;
    }

    return ALLOWED_DOMAIN.includes(domain);
}

export function isBlankText(value: string | null | undefined): boolean {
    return !value || value.trim().length === 0;
}

export function canEditField(value: string | null | undefined): boolean {
    return isBlankText(value);
}

export function getDisplayName(firstName: string | null | undefined, lastName: string | null | undefined): string {
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    return fullName || 'Not set';
}

export function generateOtpCode(): string {
    return String(randomInt(100000, 999999));
}

export async function hashOtpCode(code: string): Promise<string> {
    return bcrypt.hash(code, 6);
}

export async function compareOtpCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
}
