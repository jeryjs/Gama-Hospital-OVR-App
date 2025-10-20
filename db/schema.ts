import { pgTable, serial, varchar, text, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['admin', 'manager', 'employee']);
export const incidentTypeEnum = pgEnum('incident_type', [
  'verbal_abuse',
  'physical_assault',
  'threatening_behavior',
  'harassment',
  'property_damage',
  'other'
]);
export const severityEnum = pgEnum('severity', ['low', 'medium', 'high', 'critical']);
export const statusEnum = pgEnum('status', ['draft', 'submitted', 'under_review', 'resolved', 'closed']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  role: roleEnum('role').notNull().default('employee'),
  department: varchar('department', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Locations table
export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Incidents table
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  reporterId: integer('reporter_id').notNull().references(() => users.id),
  incidentDate: timestamp('incident_date').notNull(),
  incidentTime: varchar('incident_time', { length: 10 }),
  locationId: integer('location_id').references(() => locations.id),
  specificLocation: text('specific_location'),
  incidentType: incidentTypeEnum('incident_type').notNull(),
  severity: severityEnum('severity').notNull(),
  status: statusEnum('status').notNull().default('draft'),
  
  // Victim information
  victimName: varchar('victim_name', { length: 255 }),
  victimRole: varchar('victim_role', { length: 100 }),
  
  // Perpetrator information
  perpetratorName: varchar('perpetrator_name', { length: 255 }),
  perpetratorType: varchar('perpetrator_type', { length: 100 }), // e.g., patient, visitor, staff
  perpetratorDescription: text('perpetrator_description'),
  
  // Incident details
  description: text('description').notNull(),
  immediateAction: text('immediate_action'),
  witnessesPresent: boolean('witnesses_present').default(false),
  witnessDetails: text('witness_details'),
  policeNotified: boolean('police_notified').default(false),
  policeReportNumber: varchar('police_report_number', { length: 100 }),
  
  // Injuries and medical attention
  injuriesOccurred: boolean('injuries_occurred').default(false),
  injuryDescription: text('injury_description'),
  medicalAttentionRequired: boolean('medical_attention_required').default(false),
  medicalAttentionDetails: text('medical_attention_details'),
  
  // Follow-up
  assignedTo: integer('assigned_to').references(() => users.id),
  reviewNotes: text('review_notes'),
  resolutionNotes: text('resolution_notes'),
  resolutionDate: timestamp('resolution_date'),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  submittedAt: timestamp('submitted_at'),
});

// Incident attachments (for photos, documents, etc.)
export const incidentAttachments = pgTable('incident_attachments', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 100 }),
  uploadedBy: integer('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Incident comments/notes
export const incidentComments = pgTable('incident_comments', {
  id: serial('id').primaryKey(),
  incidentId: integer('incident_id').notNull().references(() => incidents.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  reportedIncidents: many(incidents, { relationName: 'reporter' }),
  assignedIncidents: many(incidents, { relationName: 'assignee' }),
  comments: many(incidentComments),
  attachments: many(incidentAttachments),
}));

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  reporter: one(users, {
    fields: [incidents.reporterId],
    references: [users.id],
    relationName: 'reporter',
  }),
  assignee: one(users, {
    fields: [incidents.assignedTo],
    references: [users.id],
    relationName: 'assignee',
  }),
  location: one(locations, {
    fields: [incidents.locationId],
    references: [locations.id],
  }),
  attachments: many(incidentAttachments),
  comments: many(incidentComments),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  incidents: many(incidents),
}));

export const incidentAttachmentsRelations = relations(incidentAttachments, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentAttachments.incidentId],
    references: [incidents.id],
  }),
  uploader: one(users, {
    fields: [incidentAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const incidentCommentsRelations = relations(incidentComments, ({ one }) => ({
  incident: one(incidents, {
    fields: [incidentComments.incidentId],
    references: [incidents.id],
  }),
  user: one(users, {
    fields: [incidentComments.userId],
    references: [users.id],
  }),
}));
