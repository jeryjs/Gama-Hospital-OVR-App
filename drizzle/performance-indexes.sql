-- ============================================
-- PERFORMANCE INDEXES FOR OVR SYSTEM
-- ============================================
-- These indexes will significantly improve query performance
-- as the database grows in production

-- Incidents table indexes
CREATE INDEX IF NOT EXISTS idx_ovr_reports_reporter_id ON ovr_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_status ON ovr_reports(status);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_created_at ON ovr_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_occurrence_date ON ovr_reports(occurrence_date DESC);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_supervisor_id ON ovr_reports(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_department_head_id ON ovr_reports(department_head_id);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_reference_number ON ovr_reports(reference_number);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ovr_reports_status_created ON ovr_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_reporter_status ON ovr_reports(reporter_id, status);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_category_date ON ovr_reports(occurrence_category, occurrence_date DESC);

-- Full-text search indexes (for PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_ovr_reports_reference_trgm ON ovr_reports USING gin(reference_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_description_trgm ON ovr_reports USING gin(description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ovr_reports_patient_name_trgm ON ovr_reports USING gin(patient_name gin_trgm_ops);

-- Investigators table indexes
CREATE INDEX IF NOT EXISTS idx_ovr_investigators_report_id ON ovr_investigators(ovr_report_id);
CREATE INDEX IF NOT EXISTS idx_ovr_investigators_investigator_id ON ovr_investigators(investigator_id);
CREATE INDEX IF NOT EXISTS idx_ovr_investigators_status ON ovr_investigators(status);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_ovr_comments_report_id ON ovr_comments(ovr_report_id);
CREATE INDEX IF NOT EXISTS idx_ovr_comments_user_id ON ovr_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_ovr_comments_created_at ON ovr_comments(created_at DESC);

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Locations table indexes
CREATE INDEX IF NOT EXISTS idx_locations_department_id ON locations(department_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON locations(is_active);

-- ============================================
-- ENABLE pg_trgm EXTENSION (for fuzzy search)
-- ============================================
-- Run this only once in your database
CREATE EXTENSION IF NOT EXISTS pg_trgm;
