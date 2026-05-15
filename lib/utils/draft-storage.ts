/**
 * Draft Storage Utilities - localStorage-based draft management
 * Drafts are user-only, never sent to server until submitted
 */
import { DRAFT_STORAGE_KEY, DRAFT_ID_PREFIX } from '@/lib/constants';

// Infer draft type from the incident creation schema
import type { CreateIncidentInput } from '@/lib/api/schemas';

export interface LocalDraft extends Partial<CreateIncidentInput> {
    id: string; // DRAFT-{timestamp}-{random}
    reporterId: number;
    reporterEmail: string;
    createdAt: string;
    updatedAt: string;
}

const AUTO_DRAFT_ID_PREFIX = 'auto-';

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDateString(value: unknown): value is string {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function normalizeDraft(raw: unknown): LocalDraft | null {
    if (!isPlainObject(raw)) return null;

    const id = typeof raw.id === 'string' ? raw.id : '';
    if (!id) return null;

    const reporterIdRaw = raw.reporterId;
    const reporterId =
        typeof reporterIdRaw === 'number'
            ? reporterIdRaw
            : typeof reporterIdRaw === 'string'
                ? Number(reporterIdRaw)
                : NaN;
    if (!Number.isFinite(reporterId)) return null;

    const nowIso = new Date().toISOString();
    const createdAt = isValidDateString(raw.createdAt) ? raw.createdAt : nowIso;
    const updatedAt = isValidDateString(raw.updatedAt) ? raw.updatedAt : createdAt;
    const reporterEmail = typeof raw.reporterEmail === 'string' ? raw.reporterEmail : '';

    // Preserve other draft fields (form payload), but ensure required metadata is correct.
    return {
        ...(raw as Record<string, unknown>),
        id,
        reporterId,
        reporterEmail,
        createdAt,
        updatedAt,
    } as LocalDraft;
}

/** Generate unique draft ID */
export function generateDraftId(): string {
    return `${DRAFT_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Check if ID is a draft ID */
export function isDraftId(id: string): boolean {
    return Boolean(id) && (id.startsWith(DRAFT_ID_PREFIX) || id.startsWith(AUTO_DRAFT_ID_PREFIX));
}

/** Get all drafts from localStorage */
export function getDraftsFromStorage(): LocalDraft[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed)) return [];

        const normalized = parsed
            .map(normalizeDraft)
            .filter((d): d is LocalDraft => Boolean(d));

        return normalized;
    } catch {
        return [];
    }
}

/** Get drafts for specific user */
export function getUserDrafts(userId: number): LocalDraft[] {
    return getDraftsFromStorage()
        .filter((d) => d.reporterId === userId)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

/** Get single draft by ID */
export function getDraftById(id: string): LocalDraft | null {
    return getDraftsFromStorage().find(d => d.id === id) || null;
}

/** Save draft to localStorage */
export function saveDraft(draft: LocalDraft): void {
    if (typeof window === 'undefined') return;
    const drafts = getDraftsFromStorage();
    const existingIndex = drafts.findIndex(d => d.id === draft.id);

    const nowIso = new Date().toISOString();
    const updatedDraft: LocalDraft = {
        ...draft,
        reporterId: typeof draft.reporterId === 'number' ? draft.reporterId : Number(draft.reporterId),
        reporterEmail: typeof draft.reporterEmail === 'string' ? draft.reporterEmail : '',
        createdAt: isValidDateString(draft.createdAt) ? draft.createdAt : nowIso,
        updatedAt: nowIso,
    };

    if (existingIndex >= 0) {
        drafts[existingIndex] = updatedDraft;
    } else {
        drafts.push(updatedDraft);
    }

    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
        // Ignore QuotaExceededError / storage failures to avoid breaking the form.
    }
}

/** Delete draft from localStorage */
export function deleteDraft(id: string): void {
    if (typeof window === 'undefined') return;
    const drafts = getDraftsFromStorage().filter(d => d.id !== id);
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
        // ignore
    }
}

/** Clear all drafts for user */
export function clearUserDrafts(userId: number): void {
    if (typeof window === 'undefined') return;
    const drafts = getDraftsFromStorage().filter(d => d.reporterId !== userId);
    try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch {
        // ignore
    }
}
