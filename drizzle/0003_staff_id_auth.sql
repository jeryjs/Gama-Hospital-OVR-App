-- Staff ID auth foundation: password-based login, unit field, and onboarding OTP storage.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS email_verified_at timestamp,
ADD COLUMN IF NOT EXISTS unit varchar(100) NOT NULL DEFAULT '';

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
