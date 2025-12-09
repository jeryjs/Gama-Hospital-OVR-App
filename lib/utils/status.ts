/**
 * @fileoverview Status Utilities - Centralized Status Mappings
 * 
 * Single source of truth for status colors, labels, and helpers
 * Used across the entire application for consistent status display
 */

import type { Theme } from '@mui/material';

/**
 * Valid OVR Status Values
 * Matches database enum exactly
 */
export type OVRStatus =
    | 'draft'
    | 'submitted'
    | 'qi_review'
    | 'investigating'
    | 'qi_final_actions'
    | 'closed';

/**
 * Status Display Configuration
 */
interface StatusConfig {
    label: string;
    description: string;
    color: keyof Theme['palette'];
    bgColor: string;
    icon: string;
}

/**
 * Status Configuration Map
 * Centralized configuration for all status displays
 */
export const STATUS_CONFIG: Record<OVRStatus, StatusConfig> = {
    draft: {
        label: 'Draft',
        description: 'Incident report is being prepared',
        color: 'grey',
        bgColor: 'grey.100',
        icon: '📝',
    },
    submitted: {
        label: 'Submitted',
        description: 'Awaiting QI review',
        color: 'info',
        bgColor: 'info.lighter',
        icon: '📬',
    },
    qi_review: {
        label: 'QI Review',
        description: 'QI team reviewing incident',
        color: 'warning',
        bgColor: 'warning.lighter',
        icon: '🔍',
    },
    investigating: {
        label: 'Investigating',
        description: 'Investigation in progress',
        color: 'primary',
        bgColor: 'primary.lighter',
        icon: '🔬',
    },
    qi_final_actions: {
        label: 'Final Actions',
        description: 'Corrective actions being implemented',
        color: 'secondary',
        bgColor: 'secondary.lighter',
        icon: '⚡',
    },
    closed: {
        label: 'Closed',
        description: 'Case resolved and archived',
        color: 'success',
        bgColor: 'success.lighter',
        icon: '✅',
    },
};

/**
 * Get status configuration
 */
export function getStatusConfig(status: OVRStatus | string): StatusConfig {
    return STATUS_CONFIG[status as OVRStatus] || STATUS_CONFIG.draft;
}

/**
 * Get status label
 */
export function getStatusLabel(status: OVRStatus | string): string {
    return getStatusConfig(status).label;
}

/**
 * Get status color (MUI theme color)
 */
export function getStatusColor(status: OVRStatus | string): keyof Theme['palette'] {
    return getStatusConfig(status).color;
}

/**
 * Get status description
 */
export function getStatusDescription(status: OVRStatus | string): string {
    return getStatusConfig(status).description;
}

/**
 * Check if status allows editing
 */
export function canEditIncident(status: OVRStatus | string): boolean {
    return status === 'draft';
}

/**
 * Check if status is in active workflow
 */
export function isActiveStatus(status: OVRStatus | string): boolean {
    return ['submitted', 'qi_review', 'investigating', 'qi_final_actions'].includes(status);
}

/**
 * Check if status is terminal
 */
export function isClosedStatus(status: OVRStatus | string): boolean {
    return status === 'closed';
}

/**
 * Get next status in workflow
 */
export function getNextStatus(currentStatus: OVRStatus): OVRStatus | null {
    const workflow: OVRStatus[] = [
        'draft',
        'submitted',
        'qi_review',
        'investigating',
        'qi_final_actions',
        'closed',
    ];

    const currentIndex = workflow.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex === workflow.length - 1) {
        return null;
    }

    return workflow[currentIndex + 1];
}

/**
 * Get workflow progress percentage
 */
export function getWorkflowProgress(status: OVRStatus | string): number {
    const workflow: OVRStatus[] = [
        'draft',
        'submitted',
        'qi_review',
        'investigating',
        'qi_final_actions',
        'closed',
    ];

    const index = workflow.indexOf(status as OVRStatus);
    if (index === -1) return 0;

    return Math.round((index / (workflow.length - 1)) * 100);
}

/**
 * Format status for display with emoji
 */
export function formatStatus(status: OVRStatus | string): string {
    const config = getStatusConfig(status);
    return `${config.icon} ${config.label}`;
}

/**
 * Get status badge props for MUI Chip component
 */
export function getStatusChipProps(status: OVRStatus | string) {
    const config = getStatusConfig(status);
    return {
        label: config.label,
        color: config.color as any,
        size: 'small' as const,
        icon: config.icon,
    };
}
