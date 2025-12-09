// ============================================
// SINGLE SOURCE OF TRUTH - RE-EXPORTS FROM SCHEMAS
// All types are derived from Zod schemas in lib/api/schemas.ts
// ============================================

export type {
  // User types
  User,
  UserPublic,
  UserMinimal,

  // Location types
  Location,
  LocationMinimal,

  // Comment types
  Comment,
  CommentWithUser,

  // OVR Report types
  OVRReport,
  OVRReportWithRelations,
  OVRReportListItem,

  // API types
  ApiError,
  PaginationParams,
  PaginationMeta,
  IncidentListQuery,
  CreateIncidentInput,
  UpdateIncidentInput,
} from './api/schemas';

// Re-export helper functions for column selection (no duplication)
export { getListColumns, getDetailColumns, incidentRelations } from './api/schemas';
