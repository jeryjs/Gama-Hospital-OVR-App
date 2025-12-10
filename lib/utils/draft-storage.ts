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

/** Generate unique draft ID */
export function generateDraftId(): string {
    return `${DRAFT_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Check if ID is a draft ID */
export function isDraftId(id: string): boolean {
    return id?.startsWith(DRAFT_ID_PREFIX);
}

/** Get all drafts from localStorage */
export function getDraftsFromStorage(): LocalDraft[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

/** Get drafts for specific user */
export function getUserDrafts(userId: number): LocalDraft[] {
    return getDraftsFromStorage().filter(d => d.reporterId === userId);
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

    const updatedDraft = { ...draft, updatedAt: new Date().toISOString() };

    if (existingIndex >= 0) {
        drafts[existingIndex] = updatedDraft;
    } else {
        drafts.push(updatedDraft);
    }

    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

/** Delete draft from localStorage */
export function deleteDraft(id: string): void {
    if (typeof window === 'undefined') return;
    const drafts = getDraftsFromStorage().filter(d => d.id !== id);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

/** Clear all drafts for user */
export function clearUserDrafts(userId: number): void {
    if (typeof window === 'undefined') return;
    const drafts = getDraftsFromStorage().filter(d => d.reporterId !== userId);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}
