-- Per-user notification preference overrides (in-app and mail toggles per event).
-- Default inApp=true means existing users stay opted in with no backfill needed.

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event VARCHAR(64) NOT NULL,
  in_app BOOLEAN NOT NULL DEFAULT true,
  mail BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notif_prefs_user_event_unique_idx UNIQUE (user_id, event)
);

CREATE INDEX IF NOT EXISTS notif_prefs_user_idx ON user_notification_preferences(user_id);
