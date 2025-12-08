import { relations, sql } from 'drizzle-orm';
import { boolean, date, integer, pgEnum, pgTable, serial, text, time, timestamp, varchar } from 'drizzle-orm/pg-core';

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

// OVR Form Status Workflow - Matches actual hospital process
export const ovrStatusEnum = pgEnum('ovr_status', [
  'draft',                    // Step 0: Being filled by reporter
  'submitted',                // Step 1: Waiting for QI Dept approval
  // 'supervisor_approved',      // REMOVED: Supervisor approval step eliminated - goes directly to QI
  'qi_review',                // Step 2: QI dept reviews and approves/rejects the report
  'hod_assigned',             // Step 3: After submission, directly assigned to QI who assigns to HOD
  'qi_final_review',          // Step 4: QI final review and feedback
  'closed'                    // Step 5: Case closed
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
  levelOfHarm: levelOfHarmEnum('level_of_harm'), // Added after description

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

  // Supervisor/Manager Action
  supervisorNotified: boolean('supervisor_notified').default(false),
  supervisorId: integer('supervisor_id').references(() => users.id),
  supervisorName: varchar('supervisor_name', { length: 255 }),
  supervisorAction: text('supervisor_action'),
  supervisorActionDate: timestamp('supervisor_action_date'),
  supervisorApprovedAt: timestamp('supervisor_approved_at'),

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

  // QI Department Assignment
  qiAssignedBy: integer('qi_assigned_by').references(() => users.id),
  qiAssignedDate: timestamp('qi_assigned_date'),

  // Department Head Review & Investigation
  departmentHeadId: integer('department_head_id').references(() => users.id),
  hodAssignedAt: timestamp('hod_assigned_at'),
  investigationFindings: text('investigation_findings'), // Markdown format
  problemsIdentified: text('problems_identified'),
  causeClassification: varchar('cause_classification', { length: 50 }), // From 1-10 classification
  causeDetails: text('cause_details'),
  preventionRecommendation: text('prevention_recommendation'),
  hodActionDate: timestamp('hod_action_date'),
  hodSubmittedAt: timestamp('hod_submitted_at'),

  // QI Department
  qiReceivedBy: integer('qi_received_by').references(() => users.id),
  qiReceivedDate: timestamp('qi_received_date'),
  qiFeedback: text('qi_feedback'),
  qiFormComplete: boolean('qi_form_complete'),
  qiProperCauseIdentified: boolean('qi_proper_cause_identified'),
  qiProperTimeframe: boolean('qi_proper_timeframe'),
  qiActionCompliesStandards: boolean('qi_action_complies_standards'),
  qiEffectiveCorrectiveAction: boolean('qi_effective_corrective_action'),
  severityLevel: severityLevelEnum('severity_level'),

  // Status & Workflow
  status: ovrStatusEnum('status').notNull().default('draft'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
});

// ============================================
// OVR INVESTIGATORS - Track assigned investigators
// ============================================
export const ovrInvestigators = pgTable('ovr_investigators', {
  id: serial('id').primaryKey(),
  ovrReportId: varchar('ovr_report_id', { length: 20 }).notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),
  investigatorId: integer('investigator_id').notNull().references(() => users.id),
  assignedBy: integer('assigned_by').notNull().references(() => users.id),
  findings: text('findings'), // Markdown format
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, submitted
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

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
  hodReviewedIncidents: many(ovrReports, { relationName: 'hod' }),
  qiReceivedIncidents: many(ovrReports, { relationName: 'qi_receiver' }),
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
  departmentHead: one(users, {
    fields: [ovrReports.departmentHeadId],
    references: [users.id],
    relationName: 'hod',
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
  attachments: many(ovrAttachments),
  comments: many(ovrComments),
  investigators: many(ovrInvestigators),
}));

export const ovrInvestigatorsRelations = relations(ovrInvestigators, ({ one }) => ({
  report: one(ovrReports, {
    fields: [ovrInvestigators.ovrReportId],
    references: [ovrReports.id],
  }),
  investigator: one(users, {
    fields: [ovrInvestigators.investigatorId],
    references: [users.id],
    relationName: 'investigator',
  }),
  assigner: one(users, {
    fields: [ovrInvestigators.assignedBy],
    references: [users.id],
    relationName: 'assigner',
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
