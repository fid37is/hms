-- ============================================================
-- Migration 003: Row Level Security (RLS) Policies
-- Run AFTER 001_schema.sql
-- ============================================================

-- ── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_config       ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types         ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms              ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_plans         ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE folio_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE housekeeping_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_and_found     ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff              ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log          ENABLE ROW LEVEL SECURITY;

-- ── Helper: check if caller is authenticated ─────────────────
-- Our backend uses the service role key, which bypasses RLS entirely.
-- These policies protect direct Supabase client access.

-- ── Public read-only (for hotel website / public API) ────────
CREATE POLICY "public_read_room_types"
  ON room_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "public_read_rooms"
  ON rooms FOR SELECT
  USING (is_deleted = false AND is_blocked = false);

CREATE POLICY "public_read_hotel_config"
  ON hotel_config FOR SELECT
  USING (true);

CREATE POLICY "public_read_rate_plans"
  ON rate_plans FOR SELECT
  USING (is_active = true);

-- ── Authenticated users (HMS staff) ──────────────────────────
-- The backend service role bypasses these, but they protect
-- any direct client connections.

CREATE POLICY "auth_read_users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_own_profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "auth_read_roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_read_permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_read_role_permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_guests"
  ON guests FOR ALL
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "auth_all_reservations"
  ON reservations FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_folios"
  ON folios FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_folio_items"
  ON folio_items FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_payments"
  ON payments FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_rooms"
  ON rooms FOR ALL
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "auth_all_room_types"
  ON room_types FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_housekeeping"
  ON housekeeping_tasks FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_lost_found"
  ON lost_and_found FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_inventory"
  ON inventory_items FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_suppliers"
  ON suppliers FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_stock_movements"
  ON stock_movements FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_purchase_orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_maintenance"
  ON maintenance_orders FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_assets"
  ON assets FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_departments"
  ON departments FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_staff"
  ON staff FOR ALL
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY "auth_all_shifts"
  ON shifts FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_all_leave_requests"
  ON leave_requests FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "auth_read_audit_log"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_insert_audit_log"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "auth_read_hotel_config"
  ON hotel_config FOR ALL
  TO authenticated
  USING (true);
