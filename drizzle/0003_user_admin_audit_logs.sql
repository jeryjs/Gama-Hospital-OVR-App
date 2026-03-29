CREATE TABLE IF NOT EXISTS "user_admin_audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "target_user_id" integer NOT NULL,
  "actor_user_id" integer NOT NULL,
  "action" varchar(40) NOT NULL,
  "changes" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "user_admin_audit_target_user_id_users_id_fk"
    FOREIGN KEY ("target_user_id") REFERENCES "users"("id"),
  CONSTRAINT "user_admin_audit_actor_user_id_users_id_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "user_admin_audit_target_created_idx"
  ON "user_admin_audit_logs" ("target_user_id", "created_at");

CREATE INDEX IF NOT EXISTS "user_admin_audit_actor_created_idx"
  ON "user_admin_audit_logs" ("actor_user_id", "created_at");
