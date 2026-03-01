-- ============================================================
-- Migration 002: Staff ↔ User link + staff_with_access view
-- Run AFTER 001_schema.sql
-- ============================================================

-- staff.user_id already created in 001, this adds the view

CREATE OR REPLACE VIEW staff_with_access AS
SELECT
  s.id                  AS staff_id,
  s.full_name,
  s.email               AS staff_email,
  s.phone,
  s.job_title,
  s.employment_type,
  s.status              AS staff_status,
  s.department_id,
  d.name                AS department_name,
  s.user_id,
  u.email               AS login_email,
  u.is_active           AS account_active,
  u.last_login,
  r.name                AS role_name,
  CASE WHEN s.user_id IS NOT NULL THEN true ELSE false END AS has_system_access
FROM staff s
LEFT JOIN departments d ON d.id = s.department_id
LEFT JOIN users u       ON u.id = s.user_id
LEFT JOIN roles r       ON r.id = u.role_id
WHERE s.is_deleted = false;

GRANT SELECT ON staff_with_access TO authenticated;
