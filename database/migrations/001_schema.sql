-- ============================================================
-- HMS Database Schema — Migration 001
-- Run in Supabase SQL Editor in order
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast ILIKE search

-- ============================================================
-- CORE AUTH / USERS
-- (auth.users is managed by Supabase — we mirror profile data)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  UNIQUE (module, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  department  TEXT,
  role_id     UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active   BOOLEAN DEFAULT true,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HOTEL CONFIGURATION
-- ============================================================

CREATE TABLE IF NOT EXISTS hotel_config (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_name       TEXT NOT NULL DEFAULT 'My Hotel',
  address          TEXT,
  city             TEXT,
  state            TEXT,
  country          TEXT DEFAULT 'Nigeria',
  phone            TEXT,
  email            TEXT,
  website          TEXT,
  logo_url         TEXT,
  primary_color    TEXT DEFAULT '#1F4E8C',
  currency         TEXT DEFAULT 'NGN',
  currency_symbol  TEXT DEFAULT '₦',
  tax_rate         NUMERIC(5,2) DEFAULT 7.50,
  service_charge   NUMERIC(5,2) DEFAULT 10.00,
  timezone         TEXT DEFAULT 'Africa/Lagos',
  check_in_time    TIME DEFAULT '14:00',
  check_out_time   TIME DEFAULT '11:00',
  receipt_footer   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================

CREATE TABLE IF NOT EXISTS room_types (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  description   TEXT,
  base_rate     BIGINT NOT NULL DEFAULT 0,  -- in kobo
  max_occupancy INT DEFAULT 2,
  amenities     TEXT[] DEFAULT '{}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rooms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number       TEXT NOT NULL UNIQUE,
  floor        INT,
  type_id      UUID REFERENCES room_types(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'available'
                CHECK (status IN ('available','occupied','dirty','clean','maintenance','out_of_order')),
  is_blocked   BOOLEAN DEFAULT false,
  block_reason TEXT,
  notes        TEXT,
  is_deleted   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_type_id  UUID REFERENCES room_types(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  rate          BIGINT NOT NULL,  -- in kobo per night
  valid_from    DATE NOT NULL,
  valid_to      DATE,
  days_of_week  INT[] DEFAULT '{0,1,2,3,4,5,6}',
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GUESTS
-- ============================================================

CREATE TABLE IF NOT EXISTS guests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  nationality   TEXT,
  id_type       TEXT CHECK (id_type IN ('passport','national_id','drivers_license','voters_card','other')),
  id_number     TEXT,
  date_of_birth DATE,
  address       TEXT,
  category      TEXT DEFAULT 'regular'
                CHECK (category IN ('regular','vip','corporate','blacklisted')),
  total_visits  INT DEFAULT 0,
  notes         TEXT,
  is_deleted    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RESERVATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS reservations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_no   TEXT UNIQUE,
  guest_id         UUID REFERENCES guests(id) ON DELETE SET NULL,
  room_id          UUID REFERENCES rooms(id) ON DELETE SET NULL,
  check_in_date    DATE NOT NULL,
  check_out_date   DATE NOT NULL,
  adults           INT DEFAULT 1,
  children         INT DEFAULT 0,
  status           TEXT DEFAULT 'confirmed'
                   CHECK (status IN ('confirmed','checked_in','checked_out','cancelled','no_show')),
  booking_source   TEXT DEFAULT 'walk_in'
                   CHECK (booking_source IN ('walk_in','phone','online','ota_booking_com','ota_expedia','corporate','referral')),
  rate_per_night   BIGINT DEFAULT 0,  -- in kobo
  total_amount     BIGINT DEFAULT 0,  -- in kobo
  special_requests TEXT,
  checked_in_at    TIMESTAMPTZ,
  checked_out_at   TIMESTAMPTZ,
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

-- Auto-generate reservation number
CREATE OR REPLACE FUNCTION generate_reservation_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reservation_no IS NULL THEN
    NEW.reservation_no := 'RES-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('reservation_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS reservation_no_seq START 1;

DROP TRIGGER IF EXISTS trg_reservation_no ON reservations;
CREATE TRIGGER trg_reservation_no
  BEFORE INSERT ON reservations
  FOR EACH ROW EXECUTE FUNCTION generate_reservation_no();

-- ============================================================
-- BILLING / FOLIO
-- ============================================================

CREATE TABLE IF NOT EXISTS folios (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_no       TEXT UNIQUE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id       UUID REFERENCES guests(id) ON DELETE SET NULL,
  status         TEXT DEFAULT 'open'
                 CHECK (status IN ('open','closed','voided')),
  total_charges  BIGINT DEFAULT 0,  -- in kobo
  total_payments BIGINT DEFAULT 0,  -- in kobo
  balance        BIGINT DEFAULT 0,  -- computed: charges - payments
  opened_at      TIMESTAMPTZ DEFAULT NOW(),
  closed_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS folio_no_seq START 1;

CREATE OR REPLACE FUNCTION generate_folio_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.folio_no IS NULL THEN
    NEW.folio_no := 'FOL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('folio_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_folio_no ON folios;
CREATE TRIGGER trg_folio_no
  BEFORE INSERT ON folios
  FOR EACH ROW EXECUTE FUNCTION generate_folio_no();

CREATE TABLE IF NOT EXISTS folio_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio_id    UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  department  TEXT NOT NULL CHECK (department IN ('room','food','beverage','laundry','spa','transport','telephone','minibar','other')),
  description TEXT NOT NULL,
  quantity    INT DEFAULT 1,
  unit_price  BIGINT DEFAULT 0,  -- in kobo
  amount      BIGINT DEFAULT 0,  -- in kobo
  tax_amount  BIGINT DEFAULT 0,  -- in kobo
  is_voided   BOOLEAN DEFAULT false,
  void_reason TEXT,
  voided_at   TIMESTAMPTZ,
  posted_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  posted_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_no   TEXT UNIQUE,
  folio_id     UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
  amount       BIGINT NOT NULL,  -- in kobo
  method       TEXT NOT NULL CHECK (method IN ('cash','card','bank_transfer','mobile_money','room_charge','complimentary','other')),
  gateway      TEXT,
  gateway_ref  TEXT,
  status       TEXT DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  received_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  notes        TEXT,
  received_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS payment_no_seq START 1;

CREATE OR REPLACE FUNCTION generate_payment_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_no IS NULL THEN
    NEW.payment_no := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('payment_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_no ON payments;
CREATE TRIGGER trg_payment_no
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_payment_no();

-- ============================================================
-- HOUSEKEEPING
-- ============================================================

CREATE TABLE IF NOT EXISTS housekeeping_tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id      UUID REFERENCES rooms(id) ON DELETE CASCADE,
  task_type    TEXT DEFAULT 'checkout_clean'
               CHECK (task_type IN ('checkout_clean','stayover_clean','deep_clean','turndown','inspection','special_request')),
  priority     TEXT DEFAULT 'normal'
               CHECK (priority IN ('low','normal','high','urgent')),
  status       TEXT DEFAULT 'pending'
               CHECK (status IN ('pending','in_progress','done','inspected','skipped')),
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  notes        TEXT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lost_and_found (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_description TEXT NOT NULL,
  location_found   TEXT,
  found_by         TEXT,
  found_date       DATE DEFAULT CURRENT_DATE,
  guest_id         UUID REFERENCES guests(id) ON DELETE SET NULL,
  guest_name       TEXT,
  status           TEXT DEFAULT 'found' CHECK (status IN ('found','claimed','returned','disposed')),
  notes            TEXT,
  returned_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  category     TEXT,
  notes        TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  department    TEXT,
  unit          TEXT NOT NULL DEFAULT 'pieces',
  current_stock NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  unit_cost     BIGINT DEFAULT 0,  -- in kobo
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  barcode       TEXT,
  notes         TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id    UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity   NUMERIC NOT NULL,
  unit_cost  BIGINT,  -- in kobo
  reference  TEXT,
  notes      TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update stock on movement
CREATE OR REPLACE FUNCTION trg_update_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type = 'in' THEN
    UPDATE inventory_items SET current_stock = current_stock + NEW.quantity, updated_at = NOW()
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'out' THEN
    UPDATE inventory_items SET current_stock = current_stock - NEW.quantity, updated_at = NOW()
    WHERE id = NEW.item_id;
  ELSIF NEW.type = 'adjustment' THEN
    UPDATE inventory_items SET current_stock = NEW.quantity, updated_at = NOW()
    WHERE id = NEW.item_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_movement ON stock_movements;
CREATE TRIGGER trg_stock_movement
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION trg_update_stock();

CREATE TABLE IF NOT EXISTS purchase_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_no         TEXT UNIQUE,
  supplier_id   UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','received','cancelled')),
  items         JSONB NOT NULL DEFAULT '[]',
  subtotal      BIGINT DEFAULT 0,  -- in kobo
  tax_amount    BIGINT DEFAULT 0,
  total_amount  BIGINT DEFAULT 0,
  raised_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  expected_date DATE,
  received_at   TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS po_no_seq START 1;

CREATE OR REPLACE FUNCTION generate_po_no()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_no IS NULL THEN
    NEW.po_no := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('po_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_po_no ON purchase_orders;
CREATE TRIGGER trg_po_no
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION generate_po_no();

-- ============================================================
-- MAINTENANCE
-- ============================================================

CREATE TABLE IF NOT EXISTS maintenance_orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wo_number    TEXT UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  location     TEXT,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category     TEXT DEFAULT 'general'
               CHECK (category IN ('general','electrical','plumbing','hvac','furniture','appliance','structural','other')),
  priority     TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status       TEXT DEFAULT 'open'
               CHECK (status IN ('open','assigned','in_progress','resolved','closed','deferred')),
  reported_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_to  UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution   TEXT,
  cost         BIGINT DEFAULT 0,  -- in kobo
  started_at   TIMESTAMPTZ,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS wo_no_seq START 1;

CREATE OR REPLACE FUNCTION generate_wo_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wo_number IS NULL THEN
    NEW.wo_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
      LPAD(NEXTVAL('wo_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wo_number ON maintenance_orders;
CREATE TRIGGER trg_wo_number
  BEFORE INSERT ON maintenance_orders
  FOR EACH ROW EXECUTE FUNCTION generate_wo_number();

CREATE TABLE IF NOT EXISTS assets (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  category         TEXT,
  location         TEXT,
  serial_no        TEXT,
  purchase_date    DATE,
  purchase_cost    BIGINT DEFAULT 0,  -- in kobo
  warranty_expiry  DATE,
  last_serviced    DATE,
  next_service_date DATE,
  status           TEXT DEFAULT 'operational'
                   CHECK (status IN ('operational','needs_repair','decommissioned')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAFF / HR
-- ============================================================

CREATE TABLE IF NOT EXISTS departments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        TEXT NOT NULL,
  email            TEXT,
  phone            TEXT NOT NULL,
  department_id    UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_title        TEXT,
  employment_type  TEXT DEFAULT 'full_time'
                   CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  employment_date  DATE DEFAULT CURRENT_DATE,
  salary           BIGINT DEFAULT 0,  -- in kobo per month
  bank_name        TEXT,
  bank_account_no  TEXT,
  emergency_contact JSONB DEFAULT '{}',
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','terminated','on_leave')),
  notes            TEXT,
  is_deleted       BOOLEAN DEFAULT false,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS shifts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id         UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  shift_date       DATE NOT NULL,
  scheduled_start  TIME,
  scheduled_end    TIME,
  actual_start     TIMESTAMPTZ,
  actual_end       TIMESTAMPTZ,
  hours_worked     NUMERIC(5,2),
  status           TEXT DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','active','completed','absent','cancelled')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id     UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  leave_type   TEXT NOT NULL CHECK (leave_type IN ('annual','sick','maternity','paternity','unpaid','other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  reason       TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  reviewed_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  review_notes TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_leave_dates CHECK (end_date >= start_date)
);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VIEW')),
  table_name TEXT,
  record_id  UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at  ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id     ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name  ON audit_log(table_name);

-- ============================================================
-- USEFUL INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_reservations_guest_id    ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_room_id     ON reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status      ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_dates       ON reservations(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_folios_reservation_id    ON folios(reservation_id);
CREATE INDEX IF NOT EXISTS idx_folio_items_folio_id     ON folio_items(folio_id);
CREATE INDEX IF NOT EXISTS idx_payments_folio_id        ON payments(folio_id);
CREATE INDEX IF NOT EXISTS idx_guests_search            ON guests USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rooms_status             ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_hk_tasks_status          ON housekeeping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_item_id  ON stock_movements(item_id);

-- ============================================================
-- updated_at auto-update trigger (apply to all tables)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','hotel_config','room_types','rooms','guests','reservations',
    'folios','folio_items','housekeeping_tasks','lost_and_found',
    'inventory_items','purchase_orders','maintenance_orders','assets',
    'staff','rate_plans'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
       CREATE TRIGGER trg_set_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t, t
    );
  END LOOP;
END;
$$;
