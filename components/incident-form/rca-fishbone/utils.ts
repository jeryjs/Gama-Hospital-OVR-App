/**
 * @fileoverview Utility functions for RCA and Fishbone Analysis
 */

import type { RCAAnalysis, FishboneAnalysis, WhyItem } from './types';
import { DEFAULT_FISHBONE_CATEGORIES, MAX_WHYS } from './types';

/**
 * Parse RCA JSON from database string
 */
export function parseRCAAnalysis(raw: string | null | undefined): RCAAnalysis | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.version) {
            return parsed as RCAAnalysis;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Parse Fishbone JSON from database string
 */
export function parseFishboneAnalysis(raw: string | null | undefined): FishboneAnalysis | null {
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.version) {
            return parsed as FishboneAnalysis;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Create empty RCA structure
 */
export function createEmptyRCA(): RCAAnalysis {
    return {
        version: '1.0',
        problemStatement: '',
        fiveWhys: [
            { level: 1, question: 'Why did this incident occur?', answer: '' }
        ],
        rootCause: '',
        contributingFactors: [],
    };
}

/**
 * Create empty Fishbone structure
 */
export function createEmptyFishbone(): FishboneAnalysis {
    return {
        version: '1.0',
        lastModified: new Date().toISOString(),
        problemStatement: '',
        categories: DEFAULT_FISHBONE_CATEGORIES.map(cat => ({
            ...cat,
            causes: [],
        })),
    };
}

/**
 * Add a new "Why" level to the chain
 */
export function addWhyLevel(whys: WhyItem[]): WhyItem[] {
    if (whys.length >= MAX_WHYS) return whys;

    const nextLevel = whys.length + 1;
    return [
        ...whys,
        { level: nextLevel, question: `Why? (Level ${nextLevel})`, answer: '' }
    ];
}

/**
 * Remove the last "Why" level
 */
export function removeWhyLevel(whys: WhyItem[]): WhyItem[] {
    if (whys.length <= 1) return whys;
    return whys.slice(0, -1);
}

/**
 * Validate RCA is complete enough to save
 */
export function validateRCA(rca: RCAAnalysis): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rca.problemStatement.trim()) {
        errors.push('Problem statement is required');
    }

    const answeredWhys = rca.fiveWhys.filter(w => w.answer.trim());
    if (answeredWhys.length === 0) {
        errors.push('At least one "Why" must be answered');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Validate Fishbone is complete enough to save
 */
export function validateFishbone(fishbone: FishboneAnalysis): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fishbone.problemStatement.trim()) {
        errors.push('Problem statement is required');
    }

    const totalCauses = fishbone.categories.reduce((sum, cat) => sum + cat.causes.length, 0);
    if (totalCauses === 0) {
        errors.push('At least one cause must be added to the diagram');
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Generate unique ID for causes
 */
export function generateCauseId(): string {
    return `cause_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
