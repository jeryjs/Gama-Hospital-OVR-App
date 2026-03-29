DO $$
BEGIN
  ALTER TYPE "person_involved" RENAME VALUE 'visitor_watcher' TO 'public';
EXCEPTION
  WHEN invalid_parameter_value THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "person_involved" RENAME VALUE 'others' TO 'organization';
EXCEPTION
  WHEN invalid_parameter_value THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
