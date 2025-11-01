import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import {
  ovrReports,
  ovrInvestigators,
  ovrComments,
  users,
  locations,
} from '@/db/schema';

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

// Investigator schemas (auto-generated from DB)
export const investigatorSelectSchema = createSelectSchema(ovrInvestigators);
export const investigatorInsertSchema = createInsertSchema(ovrInvestigators);

export const investigatorWithUserSchema = investigatorSelectSchema.extend({
  investigator: userPublicSchema,
});

// Comment schemas (auto-generated from DB)
export const commentSelectSchema = createSelectSchema(ovrComments);
export const commentInsertSchema = createInsertSchema(ovrComments);

export const commentWithUserSchema = commentSelectSchema.extend({
  user: userMinimalSchema,
});

// OVR Report schemas (auto-generated from DB)
export const ovrReportSelectSchema = createSelectSchema(ovrReports);
export const ovrReportInsertSchema = createInsertSchema(ovrReports);

// OVR Report with relations
export const ovrReportWithRelationsSchema = ovrReportSelectSchema.extend({
  reporter: userPublicSchema.optional(),
  location: locationMinimalSchema.optional(),
  supervisor: userMinimalSchema.optional(),
  departmentHead: userMinimalSchema.optional(),
  investigators: z.array(investigatorWithUserSchema).optional(),
  comments: z.array(commentWithUserSchema).optional(),
});

// OVR Report list item (minimal)
export const ovrReportListItemSchema = ovrReportSelectSchema.pick({
  id: true,
  referenceNumber: true,
  status: true,
  occurrenceDate: true,
  occurrenceCategory: true,
  createdAt: true,
}).extend({
  reporter: userMinimalSchema.optional(),
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

export type Investigator = z.infer<typeof investigatorSelectSchema>;
export type InvestigatorInsert = z.infer<typeof investigatorInsertSchema>;
export type InvestigatorWithUser = z.infer<typeof investigatorWithUserSchema>;

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

// API Error
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
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
  sortBy: z.enum(['createdAt', 'occurrenceDate', 'referenceNumber', 'status']).default('createdAt').catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
  status: z.string().nullish(),
  category: z.string().nullish(),
  reporterId: z.coerce.number().nullish(),
  departmentHeadId: z.coerce.number().nullish(),
  supervisorId: z.coerce.number().nullish(),
  dateFrom: z.string().datetime().nullish(),
  dateTo: z.string().datetime().nullish(),
  search: z.string().nullish(),
  fields: z.string().nullish(),
});

export type IncidentListQuery = z.infer<typeof incidentListQuerySchema>;

// ============================================
// INPUT VALIDATION SCHEMAS (with custom rules)
// Refine the auto-generated schemas with validation rules
// ============================================

export const createIncidentSchema = ovrReportInsertSchema
  .omit({
    id: true,
    referenceNumber: true,
    reporterId: true,
    createdAt: true,
    updatedAt: true,
    submittedAt: true,
    resolvedAt: true,
    closedAt: true,
    supervisorId: true,
    supervisorAction: true,
    supervisorActionDate: true,
    supervisorApprovedAt: true,
    qiReceivedBy: true,
    qiReceivedDate: true,
    qiAssignedBy: true,
    qiAssignedDate: true,
    qiFeedback: true,
    qiFormComplete: true,
    qiProperCauseIdentified: true,
    qiProperTimeframe: true,
    qiActionCompliesStandards: true,
    qiEffectiveCorrectiveAction: true,
    severityLevel: true,
    departmentHeadId: true,
    hodAssignedAt: true,
    investigationFindings: true,
    problemsIdentified: true,
    causeClassification: true,
    causeDetails: true,
    preventionRecommendation: true,
    hodActionDate: true,
    hodSubmittedAt: true,
  })
  .refine((data) => data.patientName && data.patientName.trim().length > 0, {
    message: 'Patient name is required',
    path: ['patientName'],
  })
  .refine((data) => data.patientMRN && data.patientMRN.trim().length > 0, {
    message: 'Patient MRN is required',
    path: ['patientMRN'],
  })
  .refine((data) => data.description && data.description.trim().length >= 10, {
    message: 'Description must be at least 10 characters',
    path: ['description'],
  });

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

export const updateIncidentSchema = createIncidentSchema.partial();

export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;


// ============================================
// WORKFLOW ACTION SCHEMAS
// ============================================

export const supervisorApprovalSchema = z.object({
  action: z.string().min(1, 'Supervisor action/comments are required'),
});

export const qiAssignHODSchema = z.object({
  departmentHeadId: z.number().int().positive('Department Head ID is required'),
});

export const assignInvestigatorSchema = z.object({
  investigatorId: z.number().int().positive('Investigator ID is required'),
});

export const submitFindingsSchema = z.object({
  findings: z.string().min(50, 'Findings must be at least 50 characters'),
});

export const hodSubmissionSchema = z.object({
  investigationFindings: z.string().min(100, 'Investigation findings must be at least 100 characters'),
  problemsIdentified: z.string().min(50, 'Problems identified must be at least 50 characters'),
  causeClassification: z.string().min(1, 'Cause classification is required'),
  causeDetails: z.string().min(50, 'Cause details must be at least 50 characters'),
  preventionRecommendation: z.string().min(50, 'Prevention recommendation must be at least 50 characters'),
});

export const qiFeedbackSchema = z.object({
  feedback: z.string().min(50, 'Feedback must be at least 50 characters'),
  formComplete: z.boolean(),
  causeIdentified: z.boolean(),
  timeframe: z.boolean(),
  actionComplies: z.boolean(),
  effectiveAction: z.boolean(),
  severityLevel: z.enum(['near_miss_level_1', 'no_apparent_injury_level_2', 'minor_level_3', 'major_level_4']),
});

export const createCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

export const updateCommentSchema = z.object({
  comment: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});
