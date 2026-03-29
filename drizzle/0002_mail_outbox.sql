CREATE TABLE IF NOT EXISTS "ovr_mail_outbox" (
  "id" serial PRIMARY KEY NOT NULL,
  "event" varchar(64) NOT NULL,
  "payload" text NOT NULL,
  "actor_user_id" integer NOT NULL,
  "actor_email" varchar(255) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "last_attempt_at" timestamp,
  "next_retry_at" timestamp NOT NULL DEFAULT now(),
  "sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "ovr_mail_outbox_actor_user_id_users_id_fk"
    FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
);

CREATE INDEX IF NOT EXISTS "ovr_mail_outbox_status_retry_idx"
  ON "ovr_mail_outbox" ("status", "next_retry_at");

CREATE INDEX IF NOT EXISTS "ovr_mail_outbox_actor_idx"
  ON "ovr_mail_outbox" ("actor_user_id");
