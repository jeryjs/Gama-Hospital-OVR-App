/**
 * @fileoverview Status Utilities - Centralized Status Mappings
 * 
 * Single source of truth for status colors, labels, and helpers
 * Used across the entire application for consistent status display
 */

import { ovrStatusEnum } from '@/db/schema';

type StatusChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

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

const workflow = ovrStatusEnum.enumValues as OVRStatus[];

/**
 * Status Display Configuration
 */
interface StatusConfig {
    label: string;
    description: string;
    color: StatusChipColor;
    bgColor: string;
    icon: string;
}

type StatusInput = OVRStatus | string | { status: string; qiRejectionReason?: string | null };

const REJECTED_STATUS_CONFIG: StatusConfig = {
    label: 'Rejected',
    description: 'Returned by QI for reporter follow-up',
    color: 'error',
    bgColor: 'error.lighter',
    icon: '⛔',
};

function resolveStatusConfig(input: StatusInput): StatusConfig {
    if (typeof input === 'object' && input !== null) {
        if (isRejectedStatus(input)) {
            return REJECTED_STATUS_CONFIG;
        }
        return STATUS_CONFIG[input.status as OVRStatus] || STATUS_CONFIG.draft;
    }

    return STATUS_CONFIG[input as OVRStatus] || STATUS_CONFIG.draft;
}

/**
 * Status Configuration Map
 * Centralized configuration for all status displays
 */
export const STATUS_CONFIG: Record<OVRStatus, StatusConfig> = {
    draft: {
        label: 'Draft',
        description: 'Incident report is being prepared',
        color: 'default',
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
export function getStatusLabel(status: StatusInput): string {
    return resolveStatusConfig(status).label;
}

/**
 * Get status color (MUI theme color)
 */
export function getStatusColor(status: StatusInput): StatusChipColor {
    return resolveStatusConfig(status).color;
}

/**
 * Get status description
 */
export function getStatusDescription(status: StatusInput): string {
    return resolveStatusConfig(status).description;
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
 * Check if status should be surfaced as rejected
 * (legacy compatibility: draft + rejection reason)
 */
export function isRejectedStatus(incident: { status: string; qiRejectionReason?: string | null }): boolean {
    return incident.status === 'draft' && !!incident.qiRejectionReason;
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
    const index = workflow.indexOf(status as OVRStatus);
    if (index === -1) return 0;

    return Math.round((index / (workflow.length - 1)) * 100);
}

/**
 * Check if status is at least a certain stage in the workflow
 */
export function statusAtLeast(status: OVRStatus | string, compareTo: OVRStatus): boolean {
    const statusIndex = workflow.indexOf(status as OVRStatus);
    const compareIndex = workflow.indexOf(compareTo);
    if (statusIndex === -1 || compareIndex === -1) return false;
    return statusIndex >= compareIndex;
}

/**
 * Check if status is at most a certain stage in the workflow
 */
export function statusAtMost(status: OVRStatus | string, compareTo: OVRStatus): boolean {
    const statusIndex = workflow.indexOf(status as OVRStatus);
    const compareIndex = workflow.indexOf(compareTo);
    if (statusIndex === -1 || compareIndex === -1) return false;
    return statusIndex <= compareIndex;
}

/**
 * Check if status is in a list of statuses
 */
export function statusIn(status: OVRStatus | string, statusList: OVRStatus[]): boolean {
    return statusList.includes(status as OVRStatus);
}

/**
 * Format status for display with emoji
 */
export function formatStatus(status: StatusInput): string {
    const config = resolveStatusConfig(status);
    return `${config.icon} ${config.label}`;
}

/**
 * Get status badge props for MUI Chip component
 */
export function getStatusChipProps(status: StatusInput) {
    const config = resolveStatusConfig(status);
    return {
        label: config.label,
        color: config.color,
        size: 'small' as const,
        icon: config.icon,
    };
}
