-- ============================================================
-- Seed Data
-- Run AFTER all migrations
-- NOTE: Admin user must be created via Supabase Auth first,
--       then their UUID used below.
-- ============================================================

-- ── Permissions ──────────────────────────────────────────────
INSERT INTO permissions (module, action) VALUES
  ('reservations', 'create'),  ('reservations', 'read'),
  ('reservations', 'update'),  ('reservations', 'delete'),
  ('reservations', 'checkin'), ('reservations', 'checkout'),
  ('rooms',        'read'),    ('rooms',        'update'),    ('rooms',    'status'),
  ('guests',       'create'),  ('guests',       'read'),      ('guests',   'update'),
  ('billing',      'read'),    ('billing',      'charge'),    ('billing',  'payment'),
  ('billing',      'void'),    ('billing',      'discount'),  ('billing',  'approve'),
  ('staff',        'read'),    ('staff',        'manage'),    ('staff',    'payroll'),
  ('inventory',    'read'),    ('inventory',    'update'),    ('inventory','orders'),
  ('reports',      'basic'),   ('reports',      'financial'), ('reports',  'audit'),
  ('settings',     'read'),    ('settings',     'update'),
  ('maintenance',  'read'),    ('maintenance',  'create'),    ('maintenance','update'),
  ('housekeeping', 'read'),    ('housekeeping', 'update'),    ('housekeeping','assign')
ON CONFLICT (module, action) DO NOTHING;

-- ── Roles ────────────────────────────────────────────────────
INSERT INTO roles (name, description, is_system_role) VALUES
  ('Admin',            'Full system access',                           true),
  ('Manager',          'Hotel operations management',                  true),
  ('Receptionist',     'Front desk — reservations and check-in/out',  false),
  ('Cashier',          'Billing and payments',                         false),
  ('Housekeeper',      'Housekeeping tasks',                           false),
  ('Maintenance',      'Maintenance work orders',                      false),
  ('HR Officer',       'Staff and leave management',                   false),
  ('Bar Staff',        'Bar and beverage billing',                     false),
  ('Restaurant Staff', 'Restaurant and food billing',                  false),
  ('Security',         'Read-only access',                             false)
ON CONFLICT (name) DO NOTHING;

-- ── Grant all permissions to Admin ───────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'Admin'
ON CONFLICT DO NOTHING;

-- ── Grant relevant permissions to Manager ────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('reservations','create'), ('reservations','read'),  ('reservations','update'),
  ('reservations','checkin'),('reservations','checkout'),
  ('rooms','read'),          ('rooms','update'),        ('rooms','status'),
  ('guests','create'),       ('guests','read'),         ('guests','update'),
  ('billing','read'),        ('billing','charge'),      ('billing','payment'),
  ('billing','void'),        ('billing','approve'),
  ('staff','read'),          ('staff','manage'),
  ('inventory','read'),      ('inventory','update'),    ('inventory','orders'),
  ('reports','basic'),       ('reports','financial'),
  ('housekeeping','read'),   ('housekeeping','update'), ('housekeeping','assign'),
  ('maintenance','read'),    ('maintenance','create'),  ('maintenance','update'),
  ('settings','read')
)
WHERE r.name = 'Manager'
ON CONFLICT DO NOTHING;

-- ── Grant permissions to Receptionist ────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('reservations','create'), ('reservations','read'),  ('reservations','update'),
  ('reservations','checkin'),('reservations','checkout'),
  ('rooms','read'),          ('rooms','status'),
  ('guests','create'),       ('guests','read'),         ('guests','update'),
  ('billing','read'),        ('billing','charge'),      ('billing','payment'),
  ('housekeeping','read'),
  ('reports','basic'),
  ('settings','read')
)
WHERE r.name = 'Receptionist'
ON CONFLICT DO NOTHING;

-- ── Grant permissions to Cashier ─────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('billing','read'),  ('billing','charge'), ('billing','payment'),
  ('billing','void'),  ('guests','read'),
  ('reports','basic'), ('reservations','read')
)
WHERE r.name = 'Cashier'
ON CONFLICT DO NOTHING;

-- ── Grant permissions to Housekeeper ─────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('housekeeping','read'), ('housekeeping','update'),
  ('rooms','read'),        ('rooms','status')
)
WHERE r.name = 'Housekeeper'
ON CONFLICT DO NOTHING;

-- ── Grant permissions to Maintenance ─────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('maintenance','read'), ('maintenance','create'), ('maintenance','update'),
  ('rooms','read')
)
WHERE r.name = 'Maintenance'
ON CONFLICT DO NOTHING;

-- ── Grant permissions to HR Officer ──────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON (p.module, p.action) IN (
  ('staff','read'), ('staff','manage'), ('staff','payroll'),
  ('reports','basic')
)
WHERE r.name = 'HR Officer'
ON CONFLICT DO NOTHING;

-- ── Departments ──────────────────────────────────────────────
INSERT INTO departments (name) VALUES
  ('Front Desk'),
  ('Food & Beverage'),
  ('Housekeeping'),
  ('Maintenance'),
  ('Security'),
  ('Finance'),
  ('Human Resources'),
  ('Management')
ON CONFLICT (name) DO NOTHING;

-- ── Hotel Config (initial) ───────────────────────────────────
INSERT INTO hotel_config (
  hotel_name, country, currency, currency_symbol,
  tax_rate, service_charge, timezone,
  check_in_time, check_out_time,
  receipt_footer
)
SELECT
  'My Hotel', 'Nigeria', 'NGN', '₦',
  7.50, 10.00, 'Africa/Lagos',
  '14:00', '11:00',
  'Thank you for staying with us. We hope to see you again!'
WHERE NOT EXISTS (SELECT 1 FROM hotel_config);

-- ── Sample Room Types ────────────────────────────────────────
INSERT INTO room_types (name, description, base_rate, max_occupancy, amenities) VALUES
  ('Standard',       'Comfortable standard room',          1500000, 2, ARRAY['TV','AC','WiFi']),
  ('Deluxe',         'Spacious deluxe room with king bed', 2500000, 2, ARRAY['TV','AC','WiFi','Mini Bar']),
  ('Executive Suite','Premium suite with sitting area',    5000000, 3, ARRAY['TV','AC','WiFi','Mini Bar','Bathtub','Lounge']),
  ('Family Room',    'Large room ideal for families',      3500000, 4, ARRAY['TV','AC','WiFi','Extra Beds'])
ON CONFLICT (name) DO NOTHING;

-- ── Admin user profile ───────────────────────────────────────
-- IMPORTANT: Replace '00000000-0000-0000-0000-000000000000' with the
-- actual UUID from Supabase Auth after creating the admin user there.
-- Steps:
--   1. Go to Supabase → Authentication → Users → Add User
--   2. Email: admin@hotel.com  Password: (set securely)
--   3. Copy the UUID Supabase assigns
--   4. Replace the UUID below and run

/*
INSERT INTO users (id, full_name, email, role_id, is_active)
SELECT
  '00000000-0000-0000-0000-000000000000',  -- REPLACE with real UUID
  'Admin User',
  'admin@hotel.com',
  r.id,
  true
FROM roles r
WHERE r.name = 'Admin'
ON CONFLICT (id) DO NOTHING;
*/
