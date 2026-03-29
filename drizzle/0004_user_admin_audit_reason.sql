ALTER TABLE "user_admin_audit_logs"
ADD COLUMN IF NOT EXISTS "reason" text;