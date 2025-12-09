import {
  locations,
  ovrComments,
  ovrCorrectiveActions,
  ovrInvestigations,
  ovrReports,
  ovrSharedAccess,
  severityLevelEnum,
  users,
} from '@/db/schema';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { getTableColumns } from 'drizzle-orm';
import { z } from 'zod';

// ============================================
// BASE SCHEMAS - GENERATED FROM DATABASE SCHEMA
// Single source of truth: /db/schema.ts
// ============================================

// User schemas (auto-generated from DB)
export const userSelectSchema = createSelectSchema(users);
export const userInsertSchema = createInsertSchema(users);

export const userPublicSchema = userSelectSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  department: true,
});

export const userMinimalSchema = userSelectSchema.pick({
  id: true,
  firstName: true,
  lastName: true,
});

// Location schemas (auto-generated from DB)
export const locationSelectSchema = createSelectSchema(locations);
export const locationInsertSchema = createInsertSchema(locations);

export const locationMinimalSchema = locationSelectSchema.pick({
  id: true,
  name: true,
  building: true,
  floor: true,
});

// Investigation schemas (auto-generated from DB)
export const investigationSelectSchema = createSelectSchema(ovrInvestigations);
export const investigationInsertSchema = createInsertSchema(ovrInvestigations);

// Corrective Action schemas (auto-generated from DB)
export const correctiveActionSelectSchema = createSelectSchema(ovrCorrectiveActions);
export const correctiveActionInsertSchema = createInsertSchema(ovrCorrectiveActions);

// Shared Access schemas (auto-generated from DB)
export const sharedAccessSelectSchema = createSelectSchema(ovrSharedAccess);
export const sharedAccessInsertSchema = createInsertSchema(ovrSharedAccess);

// Comment schemas (auto-generated from DB)
export const commentSelectSchema = createSelectSchema(ovrComments);
export const commentInsertSchema = createInsertSchema(ovrComments);

export const commentWithUserSchema = commentSelectSchema.extend({
  user: userMinimalSchema.extend({
    profilePicture: userSelectSchema.shape.profilePicture,
  }),
});

// OVR Report schemas (auto-generated from DB)
export const ovrReportSelectSchema = createSelectSchema(ovrReports);
export const ovrReportInsertSchema = createInsertSchema(ovrReports);

// ============================================
// COLUMN HELPERS
// Programmatically generate column selections without repeating field names
// ============================================

const ovrColumns = getTableColumns(ovrReports);

// Extract column keys programmatically - single source of truth!
const LIST_COLUMN_KEYS = ['id', 'status', 'occurrenceDate', 'occurrenceCategory', 'createdAt'] as const;

/**
 * Column selections for list view
 * Auto-generates boolean flags from column keys
 */
export function getListColumns() {
  return LIST_COLUMN_KEYS.reduce((acc, key) => {
    acc[key] = true;
    return acc;
  }, {} as Record<string, boolean>);
}

/**
 * For detail view, return undefined to get all columns
 * Drizzle will automatically select all fields when columns is undefined
 */
export function getDetailColumns() {
  return undefined;
}

/**
 * Relation configurations - reusable for both list and detail
 */
export const incidentRelations = {
  reporter: {
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      department: true,
    },
  },
  location: {
    columns: {
      id: true,
      name: true,
      building: true,
      floor: true,
    },
  },
  supervisor: {
    columns: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  involvedPerson: {
    columns: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  investigation: true,
  correctiveActions: true,
  sharedAccess: {
    columns: {
      id: true,
      email: true,
      role: true,
      status: true,
    },
  },
} as const;

// OVR Report with relations (used by detail view)
export const ovrReportWithRelationsSchema = ovrReportSelectSchema.extend({
  reporter: userPublicSchema.optional(),
  location: locationMinimalSchema.optional(),
  supervisor: userMinimalSchema.optional(),
  involvedPerson: userPublicSchema.optional(),
  investigation: z.object({
    id: z.number(),
    findings: z.string().nullable(),
    submittedAt: z.string().nullable(),
  }).optional(),
  correctiveActions: z.array(z.object({
    id: z.number(),
    title: z.string(),
    status: z.string(),
    dueDate: z.string(),
  })).optional(),
  sharedAccess: z.array(z.object({
    id: z.number(),
    email: z.string(),
    role: z.string(),
    status: z.string(),
  })).optional(),
  comments: z.array(commentWithUserSchema).optional(),
});

// OVR Report list item (minimal - auto-extends from ovrReportSelectSchema)
export const ovrReportListItemSchema = ovrReportSelectSchema.pick({
  id: true, // Now string format: OVR-YYYY-NNN
  status: true,
  occurrenceDate: true,
  occurrenceCategory: true,
  createdAt: true,
}).extend({
  reporter: userPublicSchema.optional(),
});

// ============================================
// INFER TYPES FROM SCHEMAS
// ============================================

export type User = z.infer<typeof userSelectSchema>;
export type UserInsert = z.infer<typeof userInsertSchema>;
export type UserPublic = z.infer<typeof userPublicSchema>;
export type UserMinimal = z.infer<typeof userMinimalSchema>;

export type Location = z.infer<typeof locationSelectSchema>;
export type LocationInsert = z.infer<typeof locationInsertSchema>;
export type LocationMinimal = z.infer<typeof locationMinimalSchema>;

export type Investigation = z.infer<typeof investigationSelectSchema>;
export type InvestigationInsert = z.infer<typeof investigationInsertSchema>;

export type CorrectiveAction = z.infer<typeof correctiveActionSelectSchema>;
export type CorrectiveActionInsert = z.infer<typeof correctiveActionInsertSchema>;

export type SharedAccess = z.infer<typeof sharedAccessSelectSchema>;
export type SharedAccessInsert = z.infer<typeof sharedAccessInsertSchema>;

export type Comment = z.infer<typeof commentSelectSchema>;
export type CommentInsert = z.infer<typeof commentInsertSchema>;
export type CommentWithUser = z.infer<typeof commentWithUserSchema>;

export type OVRReport = z.infer<typeof ovrReportSelectSchema>;
export type OVRReportInsert = z.infer<typeof ovrReportInsertSchema>;
export type OVRReportWithRelations = z.infer<typeof ovrReportWithRelationsSchema>;
export type OVRReportListItem = z.infer<typeof ovrReportListItemSchema>;

// ============================================
// API REQUEST/RESPONSE SCHEMAS
// ============================================

// Pagination
export const paginationParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: paginationMetaSchema,
  });

// API Error Response Schema
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  message: z.string().optional(),
  details: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
export type PaginationParams = z.infer<typeof paginationParamsSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

// ============================================
// QUERY SCHEMAS
// ============================================

export const incidentListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).catch(1),
  limit: z.coerce.number().min(1).max(100).default(10).catch(10),
  sortBy: z.enum(['createdAt', 'occurrenceDate', 'id', 'status']).default('createdAt').catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
  status: z.string().nullish(),
  category: z.string().nullish(),
  reporterId: z.coerce.number().nullish(),
  supervisorId: z.coerce.number().nullish(),
  dateFrom: z.iso.datetime().nullish(),
  dateTo: z.iso.datetime().nullish(),
  search: z.string().nullish(),
  fields: z.string().nullish(),
});

export type IncidentListQuery = z.infer<typeof incidentListQuerySchema>;

// ============================================
// INPUT VALIDATION SCHEMAS (with custom rules)
// Comprehensive validation with conditional logic based on UI form requirements
// ============================================

/**
 * Helper function to check if physician saw patient
 * Used for conditional validation of physician-related fields
 */
const requiresPhysicianDetails = (data: any): boolean => {
  return Boolean(data.physicianSawPatient);
};

/**
 * Helper function to check if hospitalized or transferred
 * Used for conditional validation of hospitalization details
 */
const requiresHospitalizationDetails = (data: any): boolean => {
  const types = data.treatmentTypes || [];
  return types.includes('hospitalized') || types.includes('transferred');
};

export const createIncidentSchema = ovrReportInsertSchema
  .omit({
    // Auto-generated fields
    id: true, // Auto-generated as OVR-YYYY-MM-NNN
    reporterId: true,
    createdAt: true,
    updatedAt: true,
    submittedAt: true,

    // QI workflow fields (set by backend)
    qiReceivedBy: true,
    qiReceivedDate: true,
    qiAssignedBy: true,
    qiAssignedDate: true,
    qiReviewedBy: true,
    qiReviewedAt: true,
    qiRejectionReason: true,

    // QI final assessment fields (set during review)
    qiFeedback: true,
    qiFormComplete: true,
    qiProperCauseIdentified: true,
    qiProperTimeframe: true,
    qiActionCompliesStandards: true,
    qiEffectiveCorrectiveAction: true,
    severityLevel: true,

    // Final case closure fields (set by QI at close)
    caseReview: true,
    reporterFeedback: true,
    closedBy: true,
    closedAt: true,
  })
  // ============================================
  // BASIC REQUIRED FIELDS
  // ============================================
  .refine((data) => data.occurrenceDate !== undefined && data.occurrenceDate !== null, {
    message: 'Occurrence date is required',
    path: ['occurrenceDate'],
  })
  .refine((data) => data.occurrenceTime !== undefined && data.occurrenceTime !== null, {
    message: 'Occurrence time is required',
    path: ['occurrenceTime'],
  })
  .refine((data) => data.locationId !== undefined && data.locationId !== null, {
    message: 'Location is required',
    path: ['locationId'],
  })
  // ============================================
  // PERSON INVOLVED VALIDATION
  // ============================================
  .refine((data) => data.personInvolved !== undefined, {
    message: 'Person involved type is required',
    path: ['personInvolved'],
  })
  .refine((data) => data.involvedPersonName && data.involvedPersonName.trim().length > 0, {
    message: 'Person name is required',
    path: ['involvedPersonName'],
  })
  // MRN is required only for patients
  .refine((data) => {
    if (data.personInvolved === 'patient') {
      return data.involvedPersonMRN && data.involvedPersonMRN.trim().length > 0;
    }
    return true;
  }, {
    message: 'Patient MRN is required',
    path: ['involvedPersonMRN'],
  })
  // ============================================
  // CLASSIFICATION & DESCRIPTION
  // ============================================
  .refine((data) => data.occurrenceCategory && data.occurrenceCategory.trim().length > 0, {
    message: 'Occurrence category is required',
    path: ['occurrenceCategory'],
  })
  .refine((data) => data.occurrenceSubcategory && data.occurrenceSubcategory.trim().length > 0, {
    message: 'Occurrence subcategory is required',
    path: ['occurrenceSubcategory'],
  })
  .refine((data) => data.description && data.description.trim().length >= 10, {
    message: 'Description must be at least 10 characters',
    path: ['description'],
  })
  .refine((data) => data.levelOfHarm && data.levelOfHarm.trim().length > 0, {
    message: 'Level of harm is required',
    path: ['levelOfHarm'],
  })
  // ============================================
  // PHYSICIAN FOLLOW-UP VALIDATION
  // Conditional: If physician saw patient, certain fields are required
  // ============================================
  .refine((data) => {
    if (requiresPhysicianDetails(data)) {
      return data.physicianName && data.physicianName.trim().length > 0;
    }
    return true;
  }, {
    message: 'Physician name is required when patient was seen by physician',
    path: ['physicianName'],
  })
  .refine((data) => {
    if (requiresPhysicianDetails(data)) {
      return data.physicianId && data.physicianId.trim().length > 0;
    }
    return true;
  }, {
    message: 'Physician ID is required when patient was seen by physician',
    path: ['physicianId'],
  })
  .refine((data) => {
    if (requiresPhysicianDetails(data)) {
      return data.treatmentProvided && data.treatmentProvided.trim().length >= 10;
    }
    return true;
  }, {
    message: 'Physician response/treatment notes are required (min 10 characters)',
    path: ['treatmentProvided'],
  })
  // ============================================
  // HOSPITALIZATION DETAILS
  // Conditional: Required if treatment type includes hospitalized/transferred
  // ============================================
  .refine((data) => {
    if (requiresHospitalizationDetails(data)) {
      return data.hospitalizedDetails && data.hospitalizedDetails.trim().length > 0;
    }
    return true;
  }, {
    message: 'Hospitalization/transfer details are required',
    path: ['hospitalizedDetails'],
  });

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = createIncidentSchema.partial();

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;


// ============================================
// WORKFLOW ACTION SCHEMAS
// New QI-led investigation workflow
// ============================================

/**
 * QI Review - Approve or reject submitted incident
 */
export const qiReviewSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional().refine((val) => {
    // If provided, must be at least 20 characters
    if (val !== undefined && val !== null && val.trim().length > 0) {
      return val.trim().length >= 20;
    }
    return true;
  }, {
    message: 'Rejection reason must be at least 20 characters',
  }),
}).refine((data) => {
  // If rejected, rejection reason is required
  if (data.decision === 'reject') {
    return data.rejectionReason && data.rejectionReason.trim().length >= 20;
  }
  return true;
}, {
  message: 'Rejection reason is required when rejecting',
  path: ['rejectionReason'],
});

export type QIReviewInput = z.infer<typeof qiReviewSchema>;

/**
 * Investigation Management - Create/update investigation
 */
export const createInvestigationSchema = z.object({
  ovrReportId: z.string().min(1, 'OVR Report ID is required'),
  // Optional: server will default to current user if not provided
  investigators: z.array(z.number().int().positive()).min(1, 'At least one investigator is required').optional(),
});

export const updateInvestigationSchema = z.object({
  findings: z.string().optional(),
  problemsIdentified: z.string().optional(),
  causeClassification: z.string().optional(),
  causeDetails: z.string().optional(),
  correctiveActionPlan: z.string().optional(), // JSON string
  rcaAnalysis: z.string().optional(),
  fishboneAnalysis: z.string().optional(),
}).refine((data) => {
  // At least one field must be provided for update
  return Object.values(data).some(val => val !== undefined && val !== null);
}, {
  message: 'At least one field must be provided',
});

export const submitInvestigationSchema = z.object({
  findings: z.string().min(100, 'Findings must be at least 100 characters'),
  problemsIdentified: z.string().min(50, 'Problems identified must be at least 50 characters'),
  causeClassification: z.string().min(1, 'Cause classification is required'),
  causeDetails: z.string().min(50, 'Cause details must be at least 50 characters'),
});

export type CreateInvestigationInput = z.infer<typeof createInvestigationSchema>;
export type UpdateInvestigationInput = z.infer<typeof updateInvestigationSchema>;
export type SubmitInvestigationInput = z.infer<typeof submitInvestigationSchema>;

/**
 * Corrective Actions - Create/update action items
 */
export const createCorrectiveActionSchema = z.object({
  ovrReportId: z.string().min(1, 'OVR Report ID is required'),
  // Optional: server will default to creator if not provided
  assignedTo: z.array(z.number().int().positive()).min(1, 'At least one assignee is required').optional(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  dueDate: z.string().datetime('Invalid date format'),
  checklist: z.string().refine((val) => {
    // Must be valid JSON array
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return false;
    }
  }, {
    message: 'Checklist must be a valid JSON array with at least one item',
  }),
});

export const updateCorrectiveActionSchema = z.object({
  checklist: z.string().optional(),
  actionTaken: z.string().optional(),
  evidenceFiles: z.string().optional(), // JSON string
});

export type CreateCorrectiveActionInput = z.infer<typeof createCorrectiveActionSchema>;
export type UpdateCorrectiveActionInput = z.infer<typeof updateCorrectiveActionSchema>;

/**
 * Shared Access - Google Forms style sharing
 */
export const createSharedAccessSchema = z.object({
  resourceType: z.enum(['investigation', 'corrective_action']),
  resourceId: z.number().int().positive(),
  ovrReportId: z.string().min(1),
  email: z.string().email('Invalid email address'),
  role: z.enum(['investigator', 'action_handler', 'viewer']),
  tokenExpiresAt: z.string().datetime().optional(),
});

export const bulkCreateSharedAccessSchema = z.object({
  resourceType: z.enum(['investigation', 'corrective_action']),
  resourceId: z.number().int().positive(),
  ovrReportId: z.string().min(1),
  invitations: z.array(z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['investigator', 'action_handler', 'viewer']),
  })).min(1, 'At least one invitation is required'),
  tokenExpiresAt: z.string().datetime().optional(),
});

export const revokeSharedAccessSchema = z.object({
  accessId: z.number().int().positive(),
});

export type CreateSharedAccessInput = z.infer<typeof createSharedAccessSchema>;
export type BulkCreateSharedAccessInput = z.infer<typeof bulkCreateSharedAccessSchema>;
export type RevokeSharedAccessInput = z.infer<typeof revokeSharedAccessSchema>;

/**
 * Close Incident - Final case closure
 */
export const closeIncidentSchema = z.object({
  caseReview: z.string().min(100, 'Case review must be at least 100 characters'),
  reporterFeedback: z.string().min(50, 'Reporter feedback must be at least 50 characters'),
});

export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;

/**
 * QI Feedback (legacy - kept for backward compatibility)
 */
export const qiFeedbackSchema = z.object({
  feedback: z.string().min(50, 'Feedback must be at least 50 characters'),
  formComplete: z.boolean(),
  causeIdentified: z.boolean(),
  timeframe: z.boolean(),
  actionComplies: z.boolean(),
  effectiveAction: z.boolean(),
  severityLevel: z.enum(severityLevelEnum.enumValues),
});

export const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

export const updateCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

// ============================================
// USER MANAGEMENT SCHEMAS
// ============================================

export const userListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).catch(1),
  pageSize: z.coerce.number().min(1).max(100).default(10).catch(10),
  search: z.string().nullish(),
  roles: z.array(z.string()).nullish(), // Changed from single 'role' to 'roles' array
  isActive: z.coerce.boolean().nullish(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'department']).default('createdAt').catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export const userUpdateSchema = userInsertSchema.pick({
  roles: true,
  department: true,
  position: true,
  isActive: true,
  employeeId: true,
}).partial();

export const userListResponseSchema = z.object({
  data: z.array(userSelectSchema),
  pagination: paginationMetaSchema,
});

export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
