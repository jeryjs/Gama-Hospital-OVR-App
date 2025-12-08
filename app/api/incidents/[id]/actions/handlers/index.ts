/**
 * Action Handlers Index
 * Central export point for all action handlers
 */

import { type ActionType } from '../types';
import { handleSupervisorApprove } from './supervisor';
import { handleQIAssignHOD, handleQIClose } from './qi';
import { handleHODSubmit } from './hod';
import { handleAssignInvestigator, handleSubmitFindings } from './investigator';
import type { OVRReport } from '@/lib/types';
import type { Session } from 'next-auth';

/**
 * Action handler function signature
 * All handlers follow this contract
 */
export type ActionHandler = (
    incident: OVRReport,
    data: any,
    session: Session
) => Promise<any>;

/**
 * Map of action types to their handler functions
 * Single source of truth for action execution
 */
export const ACTION_HANDLERS: Record<ActionType, ActionHandler> = {
    'supervisor-approve': handleSupervisorApprove,
    'qi-assign-hod': handleQIAssignHOD,
    'qi-close': handleQIClose,
    'assign-investigator': handleAssignInvestigator,
    'submit-findings': handleSubmitFindings,
    'hod-submit': handleHODSubmit,
};

/**
 * Get handler for specific action type
 */
export function getActionHandler(action: ActionType): ActionHandler {
    const handler = ACTION_HANDLERS[action];
    if (!handler) {
        throw new Error(`No handler found for action: ${action}`);
    }
    return handler;
}

// Re-export individual handlers for direct use if needed
export {
    handleSupervisorApprove,
    handleQIAssignHOD,
    handleQIClose,
    handleHODSubmit,
    handleAssignInvestigator,
    handleSubmitFindings,
};
