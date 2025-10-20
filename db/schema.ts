import { pgTable, serial, varchar, text, timestamp, integer, boolean, pgEnum, date, time } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS - Based on actual OVR form
// ============================================

export const roleEnum = pgEnum('role', ['admin', 'quality_manager', 'department_head', 'supervisor', 'employee']);

export const personInvolvedEnum = pgEnum('person_involved', ['patient', 'staff', 'visitor_watcher', 'others']);

export const injuryOutcomeEnum = pgEnum('injury_outcome', ['no_injury', 'minor', 'serious', 'death']);

export const severityLevelEnum = pgEnum('severity_level', [
  'near_miss_level_1',
  'no_apparent_injury_level_2',
  'minor_level_3',
  'major_level_4'
]);

// OVR Form Status Workflow
export const ovrStatusEnum = pgEnum('ovr_status', [
  'draft',                    // Being filled by reporter
  'submitted',                // Sent to supervisor
  'supervisor_review',        // With supervisor for action
  'qi_review',                // Quality Improvement review
  'hod_review',               // Head of Department review
  'resolved',                 // Action completed
  'closed'                    // Final closure
]);

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  googleId: varchar('google_id', { length: 255 }).unique(),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('employee'),
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
  id: serial('id').primaryKey(),
  referenceNumber: varchar('reference_number', { length: 50 }).unique(), // Auto-generated
  
  // Basic Information
  occurrenceDate: date('occurrence_date').notNull(),
  occurrenceTime: time('occurrence_time').notNull(),
  locationId: integer('location_id').references(() => locations.id),
  specificLocation: text('specific_location'),
  
  // Patient Information (if applicable)
  patientName: varchar('patient_name', { length: 255 }),
  patientMRN: varchar('patient_mrn', { length: 100 }),
  patientAge: integer('patient_age'),
  patientSex: varchar('patient_sex', { length: 20 }),
  patientUnit: varchar('patient_unit', { length: 100 }),
  
  // Person Involved
  personInvolved: personInvolvedEnum('person_involved').notNull(),
  isSentinelEvent: boolean('is_sentinel_event').default(false),
  sentinelEventDetails: text('sentinel_event_details'),
  
  // Staff Involved
  staffInvolvedId: integer('staff_involved_id').references(() => users.id),
  staffInvolvedName: varchar('staff_involved_name', { length: 255 }),
  staffPosition: varchar('staff_position', { length: 100 }),
  staffEmployeeId: varchar('staff_employee_id', { length: 50 }),
  staffDepartment: varchar('staff_department', { length: 100 }),
  
  // Incident Classification (from the 18 categories)
  occurrenceCategory: varchar('occurrence_category', { length: 50 }).notNull(), // e.g., 'medication', 'falls_injury'
  occurrenceSubcategory: varchar('occurrence_subcategory', { length: 100 }).notNull(), // e.g., 'wrong_drug'
  
  // Description
  description: text('description').notNull(),
  
  // Reporter Information
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  reporterDepartment: varchar('reporter_department', { length: 100 }),
  reporterPosition: varchar('reporter_position', { length: 100 }),
  
  // Witness Information
  witnessName: varchar('witness_name', { length: 255 }),
  witnessAccount: text('witness_account'),
  witnessDepartment: varchar('witness_department', { length: 100 }),
  witnessPosition: varchar('witness_position', { length: 100 }),
  witnessEmployeeId: varchar('witness_employee_id', { length: 50 }),
  
  // Medical Assessment
  physicianNotified: boolean('physician_notified').default(false),
  physicianSawPatient: boolean('physician_saw_patient').default(false),
  assessment: text('assessment'),
  diagnosis: text('diagnosis'),
  injuryOutcome: injuryOutcomeEnum('injury_outcome'),
  treatmentProvided: text('treatment_provided'),
  physicianName: varchar('physician_name', { length: 255 }),
  physicianId: varchar('physician_id', { length: 50 }),
  
  // Supervisor/Manager Action
  supervisorId: integer('supervisor_id').references(() => users.id),
  supervisorAction: text('supervisor_action'),
  supervisorActionDate: timestamp('supervisor_action_date'),
  
  // Department Head Review
  departmentHeadId: integer('department_head_id').references(() => users.id),
  problemsIdentified: text('problems_identified'),
  causeClassification: varchar('cause_classification', { length: 50 }), // From 1-10 classification
  causeDetails: text('cause_details'),
  preventionRecommendation: text('prevention_recommendation'),
  hodActionDate: timestamp('hod_action_date'),
  
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
// OVR ATTACHMENTS
// ============================================
export const ovrAttachments = pgTable('ovr_attachments', {
  id: serial('id').primaryKey(),
  ovrReportId: integer('ovr_report_id').notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),
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
  ovrReportId: integer('ovr_report_id').notNull().references(() => ovrReports.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  isSystemComment: boolean('is_system_comment').default(false), // For automated status changes
  createdAt: timestamp('created_at').notNull().defaultNow(),
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
  staffInvolved: one(users, {
    fields: [ovrReports.staffInvolvedId],
    references: [users.id],
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
  location: one(locations, {
    fields: [ovrReports.locationId],
    references: [locations.id],
  }),
  attachments: many(ovrAttachments),
  comments: many(ovrComments),
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
