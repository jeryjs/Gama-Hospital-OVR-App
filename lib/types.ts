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
  
  // Investigator types
  Investigator,
  InvestigatorWithUser,
  
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
