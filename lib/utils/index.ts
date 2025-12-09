/**
 * @fileoverview Utility Functions Index
 * 
 * Central export point for all utility functions
 * Organized by category for easy imports
 */

// Status utilities
export {
    STATUS_CONFIG,
    canEditIncident as canEditIncidentByStatus,
    formatStatus,
    getNextStatus,
    getStatusChipProps,
    getStatusColor,
    getStatusConfig,
    getStatusDescription,
    getStatusLabel,
    getWorkflowProgress,
    isActiveStatus,
    isClosedStatus,
    type OVRStatus,
} from './status';

// Token management
export {
    generateAccessToken,
    validateToken,
    isTokenExpired,
    createTokenExpiration,
    generateSharedAccessToken,
} from './token';

// Shared access helpers
export {
    emailsToCsv,
    csvToEmails,
    emailExistsInCsv,
    addEmailToCsv,
    removeEmailFromCsv,
    getEmailCount,
} from './shared-access';

// Checklist utilities
export {
    parseChecklist,
    stringifyChecklist,
    isChecklistComplete,
    toggleChecklistItem,
    updateChecklistItem,
    getChecklistProgress,
    createChecklist,
} from './checklist';
export type { ChecklistItem } from './checklist';

// Data access layer (security-first)
export {
    buildIncidentVisibilityFilter,
    getIncidentSecure,
    canAccessInvestigation,
    canAccessCorrectiveAction,
    getInvestigationSecure,
    getCorrectiveActionSecure,
    getInvestigationsForIncident,
    getCorrectiveActionsForIncident,
    canEditIncident,
} from './data-access';
export type { UserContext } from './data-access';
