import { relations, sql } from 'drizzle-orm';
import { boolean, date, index, integer, pgEnum, pgTable, serial, text, time, timestamp, varchar } from 'drizzle-orm/pg-core';

// ============================================
// ENUMS - Based on actual OVR form
// ============================================

// Note: roleEnum removed - now using TEXT[] for multi-role support
// Migration: roles column uses TEXT[] to support multiple roles per user

// Person involved in the incident (one of 4 types)
export const personInvolvedEnum = pgEnum('person_involved', ['patient', 'staff', 'visitor_watcher', 'others']);

export const injuryOutcomeEnum = pgEnum('injury_outcome', ['no_injury', 'minor', 'serious', 'death']);

// Level of Harm - Medication-specific (A-I) or General (Near Miss to Catastrophic)
export const levelOfHarmEnum = pgEnum('level_of_harm', [
  // Medication-specific levels (A-I)
  'med_a', 'med_b', 'med_c', 'med_d', 'med_e', 'med_f', 'med_g', 'med_h', 'med_i',
  // General levels (for non-medication incidents)
  'near_miss', 'none', 'minor', 'moderate', 'major', 'catastrophic'
]);

// Treatment/Examination types for Part 4
export const treatmentTypeEnum = pgEnum('treatment_type', [
  'first_aid',
  'sutures',
  'observation',
  'bloodwork',
  'radiology',
  'hospitalized',
  'transferred'
]);

export const severityLevelEnum = pgEnum('severity_level', [
  'near_miss',
  'no_apparent_injury',
  'minor',
  'major'
]);

// OVR Form Status Workflow - QI-led investigation workflow
export const ovrStatusEnum = pgEnum('ovr_status', [
  'draft',                    // Step 0: Being filled by reporter
  'submitted',                // Step 1: Submitted, waiting for QI review
  'qi_review',                // Step 2: QI reviews and approves/rejects
  'investigating',            // Step 3: Investigation phase - QI assigns investigators and collects findings
  'qi_final_actions',         // Step 4: QI creates action items and tracks completion
  'closed'                    // Step 5: Case closed with feedback
]);

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  azureId: varchar('azure_id', { length: 255 }).unique(),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),

  // Multi-role support - users can have multiple roles via Azure AD groups
  roles: text('roles').array().notNull().default(sql`ARRAY['employee']::text[]`),

  department: varchar('department', { length: 100 }),
  position: varchar('position', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  profilePicture: text('profile_picture'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// DEPARTMENTS & LOCATIONS
// ============================================
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  headOfDepartment: integer('head_of_department').references(() => users.id),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).unique(),
  departmentId: integer('department_id').references(() => departments.id),
  building: varchar('building', { length: 100 }),
  floor: varchar('floor', { length: 50 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// MAIN OVR INCIDENT REPORTS TABLE
// ============================================
export const ovrReports = pgTable('ovr_reports', {
  id: varchar('id', { length: 20 }).primaryKey(), // Format: OVR-YYYY-MM-NNN
  // refNo removed - id IS the refNo now

  // Basic Information
  occurrenceDate: date('occurrence_date').notNull(),
  occurrenceTime: time('occurrence_time').notNull(),
  locationId: integer('location_id').references(() => locations.id),
  specificLocation: text('specific_location'),

  // ============================================
  // PERSON INVOLVED (unified for all 4 types)
  // ============================================
  // Type: patient | staff | visitor_watcher | others
  personInvolved: personInvolvedEnum('person_involved').notNull(),

  // Common fields (all types)
  involvedPersonName: varchar('involved_person_name', { length: 255 }),

  // Demographics (patient, visitor_watcher, others - NOT staff)
  involvedPersonAge: integer('involved_person_age'),
  involvedPersonSex: varchar('involved_person_sex', { length: 20 }),

  // Unit/Department (patient = ward, staff = department)
  involvedPersonUnit: varchar('involved_person_unit', { length: 100 }),

  // Patient-specific
  involvedPersonMRN: varchar('involved_person_mrn', { length: 100 }),

  // Staff-specific
  involvedStaffId: integer('involved_staff_id').references(() => users.id),
  involvedPersonEmployeeId: varchar('involved_person_employee_id', { length: 50 }),
  involvedPersonPosition: varchar('involved_person_position', { length: 100 }),

  // Visitor/Others-specific
  involvedPersonRelation: varchar('involved_person_relation', { length: 100 }), // Relation to patient
  involvedPersonContact: varchar('involved_person_contact', { length: 100 }),

  // Sentinel Event
  isSentinelEvent: boolean('is_sentinel_event').default(false),
  sentinelEventDetails: text('sentinel_event_details'),

  // Incident Classification (from the 18 categories for now. Will later change to Saudi Patient Safety Taxonomy)
  occurrenceCategory: varchar('occurrence_category', { length: 50 }).notNull(), // e.g., 'medication', 'falls_injury'
  occurrenceSubcategory: varchar('occurrence_subcategory', { length: 100 }).notNull(), // e.g., 'wrong_drug'
  occurrenceDetail: varchar('occurrence_detail', { length: 100 }),

  // Description
  description: text('description').notNull(),
  levelOfHarm: levelOfHarmEnum('level_of_harm'),

  // Reporter Information
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  reporterDepartment: varchar('reporter_department', { length: 100 }),
  reporterPosition: varchar('reporter_position', { length: 100 }),


  // Medical Assessment / Physician Follow-up
  physicianNotified: boolean('physician_notified').default(false),
  physicianSawPatient: boolean('physician_saw_patient').default(false),
  assessment: text('assessment'),
  diagnosis: text('diagnosis'),
  injuryOutcome: injuryOutcomeEnum('injury_outcome'),

  // Treatment details
  treatmentTypes: text('treatment_types').array(),
  hospitalizedDetails: varchar('hospitalized_details', { length: 255 }),
  treatmentProvided: text('treatment_provided'),
  physicianName: varchar('physician_name', { length: 255 }),
  physicianId: varchar('physician_id', { length: 50 }),
  physicianSignatureDate: timestamp('physician_signature_date'),

  // Risk Assessment
  riskImpact: integer('risk_impact'), // 1-5 (Negligible to Catastrophic)
  riskLikelihood: integer('risk_likelihood'), // 1-5 (Rare to Almost Certain)
  riskScore: integer('risk_score'), // Calculated: impact * likelihood

  // Supervisor Notification (for information only, no approval)
  supervisorNotified: boolean('supervisor_notified'),
  supervisorId: integer('supervisor_id').references(() => users.id),
  supervisorAction: text('supervisor_action'), // Notes only

  // QI Department Review & Assignment
  qiReceivedBy: integer('qi_received_by').references(() => users.id),
  qiReceivedDate: timestamp('qi_received_date'),
  qiAssignedBy: integer('qi_assigned_by').references(() => users.id),
  qiAssignedDate: timestamp('qi_assigned_date'),
  qiApprovedBy: integer('qi_approved_by').references(() => users.id),
  qiApprovedAt: timestamp('qi_approved_at'),
  qiRejectionReason: text('qi_rejection_reason'), // If rejected during qi_review

  // QI Final Assessment (old fields kept for backward compatibility)
  qiFeedback: text('qi_feedback'),
  qiFormComplete: boolean('qi_form_complete'),
  qiProperCauseIdentified: boolean('qi_proper_cause_identified'),
  qiProperTimeframe: boolean('qi_proper_timeframe'),
  qiActionCompliesStandards: boolean('qi_action_complies_standards'),
  qiEffectiveCorrectiveAction: boolean('qi_effective_corrective_action'),
  severityLevel: severityLevelEnum('severity_level'),

  // Final Case Closure
  caseReview: text('case_review'), // Final case review & takeaways (Markdown)
  reporterFeedback: text('reporter_feedback'), // Feedback for the reporter
  closedBy: integer('closed_by').references(() => users.id),
  closedAt: timestamp('closed_at'),

  // Status & Workflow
  status: ovrStatusEnum('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  resolvedAt: timestamp('resolved_at'),
});

// ============================================
// OVR INVESTIGATIONS - Investigation phase tracking
// ============================================
export const ovrInvestigations = pgTable('ovr_investigations', {
  id: serial('id').primaryKey(),
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),

  // Investigation Content
  findings: text('findings'), // Markdown format
  problemsIdentified: text('problems_identified'),
  causeClassification: varchar('cause_classification', { length: 50 }),
  causeDetails: text('cause_details'),
  correctiveActionPlan: text('corrective_action_plan'), // JSON array of checklist items

  // RCA & Fishbone (for high/extreme risk only)
  rcaAnalysis: text('rca_analysis'), // Markdown/JSON
  fishboneAnalysis: text('fishbone_analysis'), // Markdown/JSON

  // Metadata
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'), // When investigators submit
});

// ============================================
// OVR CORRECTIVE ACTIONS - Action items tracking
// ============================================
export const ovrCorrectiveActions = pgTable('ovr_corrective_actions', {
  id: serial('id').primaryKey(),
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),

  // Action Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('open'), // 'open' | 'closed'

  // Action Checklist & Completion
  checklist: text('checklist').notNull(), // JSON: [{item: string, completed: boolean}]
  actionTaken: text('action_taken'), // Markdown
  evidenceFiles: text('evidence_files'), // JSON array of file metadata

  // Metadata
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  closedBy: integer('closed_by').references(() => users.id),
  closedAt: timestamp('closed_at'),
});

// ============================================
// SHARED ACCESS - Google Forms style sharing
// Resource types: 'investigation' | 'corrective_action'
// ============================================
export const ovrSharedAccess = pgTable('ovr_shared_access', {
  id: serial('id').primaryKey(),

  // Resource identification
  resourceType: varchar('resource_type', { length: 30 }).notNull(), // 'investigation' | 'corrective_action'
  resourceId: integer('resource_id').notNull(), // ID of investigation or action
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),

  // Access details
  email: varchar('email', { length: 255 }).notNull(), // Email invited (may not be user yet)
  userId: integer('user_id').references(() => users.id), // Linked user if registered
  role: varchar('role', { length: 30 }).notNull(), // 'investigator' | 'action_handler' | 'viewer'

  // Access token for email-based access
  accessToken: varchar('access_token', { length: 64 }).notNull().unique(),
  tokenExpiresAt: timestamp('token_expires_at'),

  // Status
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending' | 'accepted' | 'revoked'
  lastAccessedAt: timestamp('last_accessed_at'),

  // Metadata
  invitedBy: integer('invited_by').notNull().references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  revokedBy: integer('revoked_by').references(() => users.id),
  revokedAt: timestamp('revoked_at'),
}, (table) => ({
  // Composite index for fast lookups
  resourceIdx: index('ovr_shared_access_resource_idx').on(table.resourceType, table.resourceId),
  tokenIdx: index('ovr_shared_access_token_idx').on(table.accessToken),
  emailIdx: index('ovr_shared_access_email_idx').on(table.email),
}));

// ============================================
// OVR ATTACHMENTS
// ============================================
export const ovrAttachments = pgTable('ovr_attachments', {
  id: serial('id').primaryKey(),
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }),
  fileSize: integer('file_size'),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================
// OVR COMMENTS/ACTIVITY LOG
// ============================================
export const ovrComments = pgTable('ovr_comments', {
  id: serial('id').primaryKey(),
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  isSystemComment: boolean('is_system_comment').default(false), // For automated status changes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
  reportedIncidents: many(ovrReports, { relationName: 'reporter' }),
  supervisedIncidents: many(ovrReports, { relationName: 'supervisor' }),
  qiReceivedIncidents: many(ovrReports, { relationName: 'qi_receiver' }),
  investigations: many(ovrInvestigations),
  correctiveActions: many(ovrCorrectiveActions, { relationName: 'action_creator' }),
  sharedAccess: many(ovrSharedAccess, { relationName: 'shared_user' }),
  comments: many(ovrComments),
  attachments: many(ovrAttachments),
  headedDepartment: one(departments, {
    fields: [users.id],
    references: [departments.headOfDepartment],
  }),
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  locations: many(locations),
  headOfDepartment: one(users, {
    fields: [departments.headOfDepartment],
    references: [users.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  department: one(departments, {
    fields: [locations.departmentId],
    references: [departments.id],
  }),
  incidents: many(ovrReports),
}));

export const ovrReportsRelations = relations(ovrReports, ({ one, many }) => ({
  reporter: one(users, {
    fields: [ovrReports.reporterId],
    references: [users.id],
    relationName: 'reporter',
  }),
  involvedPerson: one(users, {
    fields: [ovrReports.involvedStaffId],
    references: [users.id],
    relationName: 'involvedPerson',
  }),
  supervisor: one(users, {
    fields: [ovrReports.supervisorId],
    references: [users.id],
    relationName: 'supervisor',
  }),
  qiReceiver: one(users, {
    fields: [ovrReports.qiReceivedBy],
    references: [users.id],
    relationName: 'qi_receiver',
  }),
  qiAssigner: one(users, {
    fields: [ovrReports.qiAssignedBy],
    references: [users.id],
    relationName: 'qi_assigner',
  }),
  location: one(locations, {
    fields: [ovrReports.locationId],
    references: [locations.id],
  }),
  investigation: one(ovrInvestigations, {
    fields: [ovrReports.id],
    references: [ovrInvestigations.ovrReportId],
  }),
  correctiveActions: many(ovrCorrectiveActions),
  sharedAccess: many(ovrSharedAccess),
  attachments: many(ovrAttachments),
  comments: many(ovrComments),
}));

export const ovrInvestigationsRelations = relations(ovrInvestigations, ({ one, many }) => ({
  report: one(ovrReports, {
    fields: [ovrInvestigations.ovrReportId],
    references: [ovrReports.id],
  }),
  creator: one(users, {
    fields: [ovrInvestigations.createdBy],
    references: [users.id],
  }),
  sharedAccess: many(ovrSharedAccess),
}));

export const ovrCorrectiveActionsRelations = relations(ovrCorrectiveActions, ({ one, many }) => ({
  report: one(ovrReports, {
    fields: [ovrCorrectiveActions.ovrReportId],
    references: [ovrReports.id],
  }),
  creator: one(users, {
    fields: [ovrCorrectiveActions.createdBy],
    references: [users.id],
    relationName: 'action_creator',
  }),
  closer: one(users, {
    fields: [ovrCorrectiveActions.closedBy],
    references: [users.id],
    relationName: 'action_closer',
  }),
  sharedAccess: many(ovrSharedAccess),
}));

export const ovrSharedAccessRelations = relations(ovrSharedAccess, ({ one }) => ({
  report: one(ovrReports, {
    fields: [ovrSharedAccess.ovrReportId],
    references: [ovrReports.id],
  }),
  user: one(users, {
    fields: [ovrSharedAccess.userId],
    references: [users.id],
    relationName: 'shared_user',
  }),
  inviter: one(users, {
    fields: [ovrSharedAccess.invitedBy],
    references: [users.id],
    relationName: 'inviter',
  }),
  revoker: one(users, {
    fields: [ovrSharedAccess.revokedBy],
    references: [users.id],
    relationName: 'revoker',
  }),
}));

export const ovrAttachmentsRelations = relations(ovrAttachments, ({ one }) => ({
  report: one(ovrReports, {
    fields: [ovrAttachments.ovrReportId],
    references: [ovrReports.id],
  }),
  uploader: one(users, {
    fields: [ovrAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const ovrCommentsRelations = relations(ovrComments, ({ one }) => ({
  report: one(ovrReports, {
    fields: [ovrComments.ovrReportId],
    references: [ovrReports.id],
  }),
  user: one(users, {
    fields: [ovrComments.userId],
    references: [users.id],
  }),
}));
