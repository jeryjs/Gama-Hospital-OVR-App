/**
 * Action Types & Payload Definitions
 * Central definition of all incident actions
 * NO DUPLICATION - derives everything from existing schemas
 */

import { z } from 'zod';
import {
    supervisorApprovalSchema,
    qiAssignHODSchema,
    qiFeedbackSchema,
    assignInvestigatorSchema,
    submitFindingsSchema,
    hodSubmissionSchema,
} from '@/lib/api/schemas';

/**
 * Map of action schemas
 * Keys define the valid action types
 */
export const ACTION_SCHEMAS = {
    'supervisor-approve': supervisorApprovalSchema,
    'qi-assign-hod': qiAssignHODSchema,
    'qi-close': qiFeedbackSchema,
    'assign-investigator': assignInvestigatorSchema,
    'submit-findings': submitFindingsSchema,
    'hod-submit': hodSubmissionSchema,
} as const;

/**
 * Action type - derived from schema keys
 */
export type ActionType = keyof typeof ACTION_SCHEMAS;

/**
 * Action types as constants for convenience
 * Derived from ACTION_SCHEMAS keys
 */
export const ACTION_TYPES = Object.keys(ACTION_SCHEMAS) as ActionType[];

/**
 * Action payload schema - validates action type and data
 * Action enum is derived from ACTION_SCHEMAS keys
 */
export const actionPayloadSchema = z.object({
    action: z.enum(ACTION_TYPES as [ActionType, ...ActionType[]]),
    data: z.record(z.string(), z.unknown()),
});

export type ActionPayload = z.infer<typeof actionPayloadSchema>;

/**
 * Get the schema for a specific action type
 */
export function getActionSchema(action: ActionType) {
    const schema = ACTION_SCHEMAS[action];
    if (!schema) {
        throw new Error(`No schema found for action: ${action}`);
    }
    return schema;
}

/**
 * Validate action payload data against its schema
 * Returns validated data with proper typing
 */
export function validateActionData(action: ActionType, data: unknown): any {
    const schema = getActionSchema(action);
    return schema.parse(data);
}
