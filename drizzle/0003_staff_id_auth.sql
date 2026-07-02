-- Staff ID auth foundation: password-based login, unit field, and onboarding OTP storage.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS email_verified_at timestamp,
ADD COLUMN IF NOT EXISTS department_id integer REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS unit_id integer REFERENCES departments(id);

UPDATE users u
SET department_id = d.id
FROM departments d
WHERE u.department IS NOT NULL
  AND btrim(u.department) <> ''
  AND d.parent_department_id IS NULL
  AND lower(d.name) = lower(btrim(u.department))
  AND u.department_id IS NULL;

UPDATE users u
SET unit_id = d.id
FROM departments d
WHERE u.unit IS NOT NULL
  AND btrim(u.unit) <> ''
  AND d.parent_department_id IS NOT NULL
  AND lower(d.name) = lower(btrim(u.unit))
  AND u.unit_id IS NULL;

ALTER TABLE users
DROP COLUMN IF EXISTS department,
DROP COLUMN IF EXISTS unit;

ALTER TABLE users
ALTER COLUMN first_name SET DEFAULT '',
ALTER COLUMN last_name SET DEFAULT '';

CREATE TABLE IF NOT EXISTS user_email_otps (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id varchar(50) NOT NULL,
  email varchar(255) NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  verified_at timestamp,
  attempts integer NOT NULL DEFAULT 0,
  send_count integer NOT NULL DEFAULT 1,
  last_sent_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_email_otps_user_created_idx
ON user_email_otps (user_id, created_at);

CREATE INDEX IF NOT EXISTS user_email_otps_employee_created_idx
ON user_email_otps (employee_id, created_at);
