-- Migration: Unify person involved fields
-- Date: 2025-12-06
-- Description: Replace separate patient_* and staff_involved_* columns with unified involved_person_* columns

-- Step 1: Add new unified columns
ALTER TABLE ovr_reports
  ADD COLUMN involved_person_name VARCHAR(255),
  ADD COLUMN involved_person_age INTEGER,
  ADD COLUMN involved_person_sex VARCHAR(20),
  ADD COLUMN involved_person_unit VARCHAR(100),
  ADD COLUMN involved_person_mrn VARCHAR(100),
  ADD COLUMN involved_staff_id INTEGER REFERENCES users(id),
  ADD COLUMN involved_person_employee_id VARCHAR(50),
  ADD COLUMN involved_person_position VARCHAR(100),
  ADD COLUMN involved_person_relation VARCHAR(100),
  ADD COLUMN involved_person_contact VARCHAR(100);

-- Step 2: Migrate existing patient data to unified columns
-- (Prioritize patient data as per requirements - staff data can be dropped for test DB)
UPDATE ovr_reports
SET 
  involved_person_name = patient_name,
  involved_person_age = patient_age,
  involved_person_sex = patient_sex,
  involved_person_unit = COALESCE(patient_unit, staff_involved_department),
  involved_person_mrn = patient_mrn,
  involved_staff_id = staff_involved_id,
  involved_person_employee_id = staff_involved_employee_id,
  involved_person_position = staff_involved_position
WHERE patient_name IS NOT NULL OR staff_involved_name IS NOT NULL;

-- For staff-only records, migrate staff name
UPDATE ovr_reports
SET involved_person_name = staff_involved_name
WHERE patient_name IS NULL AND staff_involved_name IS NOT NULL;

-- Step 3: Drop old columns (ONLY after verifying migration)
ALTER TABLE ovr_reports
  DROP COLUMN IF EXISTS patient_name,
  DROP COLUMN IF EXISTS patient_mrn,
  DROP COLUMN IF EXISTS patient_age,
  DROP COLUMN IF EXISTS patient_sex,
  DROP COLUMN IF EXISTS patient_unit,
  DROP COLUMN IF EXISTS staff_involved_id,
  DROP COLUMN IF EXISTS staff_involved_name,
  DROP COLUMN IF EXISTS staff_involved_position,
  DROP COLUMN IF EXISTS staff_involved_employee_id,
  DROP COLUMN IF EXISTS staff_involved_department;

-- Step 4: Create index for staff lookup
CREATE INDEX IF NOT EXISTS idx_ovr_reports_involved_staff ON ovr_reports (involved_staff_id);

-- Rollback instructions (if needed):
-- This migration is destructive. To rollback, restore from backup.
