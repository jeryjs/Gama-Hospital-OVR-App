-- Adds Unit support as child Departments and migrates existing locations under default Units.

ALTER TABLE departments
ADD COLUMN IF NOT EXISTS parent_department_id integer REFERENCES departments(id);

CREATE INDEX IF NOT EXISTS departments_parent_department_id_idx
ON departments (parent_department_id);

-- Create a default "General" Unit for every top-level Department that currently has Locations,
-- then move those Locations to the new Unit.
WITH depts_with_locations AS (
  SELECT d.id, d.code, d.head_of_department, d.is_active
  FROM departments d
  WHERE d.parent_department_id IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM departments u
    WHERE u.parent_department_id = d.id
    AND u.name = 'General'
  )
  AND EXISTS (
    SELECT 1
    FROM locations l
    WHERE l.department_id = d.id
  )
), inserted_units AS (
  INSERT INTO departments (
    name,
    code,
    parent_department_id,
    head_of_department,
    is_active,
    created_at
  )
  SELECT
    'General' AS name,
    (LEFT(d.code, 15) || '_u' || SUBSTR(MD5(d.id::text), 1, 3)) AS code,
    d.id AS parent_department_id,
    d.head_of_department,
    d.is_active,
    NOW() AS created_at
  FROM depts_with_locations d
  RETURNING id, parent_department_id
)
UPDATE locations l
SET department_id = u.id
FROM inserted_units u
WHERE l.department_id = u.parent_department_id;
