DELETE FROM ovr_shared_access a
USING ovr_shared_access b
WHERE a.id < b.id
  AND a.resource_type = b.resource_type
  AND a.resource_id = b.resource_id
  AND a.role = b.role
  AND lower(a.email) = lower(b.email);

CREATE UNIQUE INDEX IF NOT EXISTS ovr_shared_access_unique_active_person_role_idx
ON ovr_shared_access (resource_type, resource_id, role, lower(email));
