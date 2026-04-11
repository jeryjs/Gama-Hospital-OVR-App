/**
 * @fileoverview Types for RCA and Fishbone Analysis
 */

// 5 Whys chain item
export interface WhyItem {
    level: number;
    question: string;
    answer: string;
}

// Contributing factor tag
export interface ContributingFactor {
    id: string;
    label: string;
    votes?: number;
}

// RCA Analysis structure
export interface RCAAnalysis {
    version: string;
    problemStatement: string;
    fiveWhys: WhyItem[];
    rootCause: string;
    contributingFactors: ContributingFactor[];
    lastModified?: string;
}

// Fishbone cause item
export interface FishboneCause {
    id: string;
    text: string;
    votes?: number;
}

// Fishbone category (bone)
export interface FishboneCategory {
    id: string;
    label: string;
    color: string;
    causes: FishboneCause[];
}

// Fishbone diagram structure
export interface FishboneAnalysis {
    version: string;
    lastModified: string;
    problemStatement: string;
    categories: FishboneCategory[];
    viewBox?: { x: number; y: number; width: number; height: number };
    zoom?: number;
    pan?: { x: number; y: number };
}

// Default categories for healthcare incidents
export const DEFAULT_FISHBONE_CATEGORIES: Omit<FishboneCategory, 'causes'>[] = [
    { id: 'people', label: 'People', color: '#00E599' },
    { id: 'process', label: 'Process', color: '#00D1FF' },
    { id: 'equipment', label: 'Equipment', color: '#B84FFF' },
    { id: 'environment', label: 'Environment', color: '#F59E0B' },
    { id: 'communication', label: 'Communication', color: '#EC4899' },
    { id: 'management', label: 'Management', color: '#8B5CF6' },
];

// Constants
export const MAX_WHYS = 5;
export const MIN_WHYS = 3;
