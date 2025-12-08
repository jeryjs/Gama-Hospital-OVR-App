/**
 * Permission Validators for Incident Actions
 * Centralized permission checks for all action types
 */

import { ACCESS_CONTROL } from '@/lib/access-control';
import { AuthorizationError } from '@/lib/api/middleware';
import type { OVRReportWithRelations } from '@/lib/types';
import type { Session } from 'next-auth';
import { type ActionType } from './types';

/**
 * Permission validator function signature
 */
type PermissionValidator = (session: Session, incident: OVRReportWithRelations) => boolean;

/**
 * Status validators for each action type
 * Checks if incident is in correct status for the action
 */
const STATUS_REQUIREMENTS: Record<ActionType, string[]> = {
    // 'supervisor-approve': ['submitted'], // REMOVED: Supervisor approval step eliminated
    'supervisor-approve': [], // Disabled - keeping for backward compatibility
    'qi-assign-hod': ['hod_assigned'], // Changed: Now accepts hod_assigned (submitted directly)
    'assign-investigator': ['hod_assigned'],
    'submit-findings': ['hod_assigned'],
    'hod-submit': ['hod_assigned'],
    'qi-close': ['qi_final_review'],
};

/**
 * Permission validators for each action type
 * Checks if user has required roles for the action
 */
const PERMISSION_VALIDATORS: Record<ActionType, PermissionValidator> = {
    'supervisor-approve': (session, incident) => {
        return ACCESS_CONTROL.api.supervisorApproval.canApprove(session.user.roles);
    },

    'qi-assign-hod': (session, incident) => {
        return ACCESS_CONTROL.api.qualityInspection.canAssignHOD(session.user.roles);
    },

    'qi-close': (session, incident) => {
        return ACCESS_CONTROL.api.qualityInspection.canCloseIncident(session.user.roles);
    },

    'assign-investigator': (session, incident) => {
        return ACCESS_CONTROL.api.investigatorAssignment.canAssign(session.user.roles);
    },

    'submit-findings': (session, incident) => {
        // User must be an assigned investigator
        const userId = parseInt(session.user.id);
        return incident.investigators?.some((inv: any) => inv.investigatorId === userId) || false;
    },

    'hod-submit': (session, incident) => {
        // User must be the assigned HOD or have elevated permissions
        const userId = parseInt(session.user.id);
        const isAssignedHOD = incident.departmentHeadId === userId;
        return ACCESS_CONTROL.api.hodInvestigation.canSubmit(session.user.roles, isAssignedHOD);
    },
};

/**
 * Validates if user can perform the requested action
 * Throws AuthorizationError if not permitted
 * 
 * @param session - User session
 * @param incident - Incident to perform action on
 * @param action - Action type to perform
 * @throws {AuthorizationError} If user lacks permission or incident in wrong status
 */
export function validateActionPermission(
    session: Session,
    incident: OVRReportWithRelations,
    action: ActionType
): void {
    // Check status requirement
    const allowedStatuses = STATUS_REQUIREMENTS[action];
    if (!allowedStatuses.includes(incident.status)) {
        throw new AuthorizationError(
            `Incident must be in ${allowedStatuses.join(' or ')} status to perform this action`
        );
    }

    // Check role permission
    const validator = PERMISSION_VALIDATORS[action];
    const hasPermission = validator(session, incident);

    if (!hasPermission) {
        throw new AuthorizationError(
            `You do not have permission to perform: ${action}`
        );
    }
}

/**
 * Check if user can perform action without throwing
 * Useful for UI conditional rendering
 */
export function canPerformAction(
    session: Session,
    incident: OVRReportWithRelations,
    action: ActionType
): boolean {
    try {
        validateActionPermission(session, incident, action);
        return true;
    } catch {
        return false;
    }
}
