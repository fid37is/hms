# HMS Database

This directory contains all SQL for the HMS PostgreSQL database (hosted on Supabase).

## Directory Structure

```
database/
├── migrations/
│   ├── 001_schema.sql        — All tables, triggers, indexes
│   ├── 002_staff_user_link.sql — staff_with_access view
│   └── 003_rls_policies.sql  — Row Level Security policies
└── seeds/
    └── 001_seed.sql          — Roles, permissions, departments, sample data
```

## First-Time Setup

Run scripts **in order** in the Supabase SQL Editor:

### 1. Create the schema
```
Supabase → SQL Editor → New Query → paste 001_schema.sql → Run
```

### 2. Add the staff-user view
```
paste 002_staff_user_link.sql → Run
```

### 3. Apply RLS policies
```
paste 003_rls_policies.sql → Run
```

### 4. Seed initial data
```
paste 001_seed.sql → Run
```

### 5. Create the admin user
1. Go to **Supabase → Authentication → Users → Add User**
2. Email: `admin@hotel.com`, set a strong password
3. Copy the UUID Supabase assigns
4. In `seeds/001_seed.sql`, uncomment the INSERT at the bottom
5. Replace `00000000-0000-0000-0000-000000000000` with the real UUID
6. Run just that INSERT statement

## Tables (28 total)

| Table | Purpose |
|-------|---------|
| `users` | HMS login accounts (mirrored from Supabase Auth) |
| `roles` | Admin, Manager, Receptionist, etc. |
| `permissions` | Granular module:action permissions |
| `role_permissions` | Many-to-many role ↔ permission |
| `hotel_config` | Hotel name, address, tax rate, check-in times |
| `room_types` | Standard, Deluxe, Suite, etc. with base rates |
| `rooms` | Individual rooms with status |
| `rate_plans` | Date-based room pricing overrides |
| `guests` | Guest profiles and stay history |
| `reservations` | Bookings with check-in/out dates |
| `folios` | Guest billing accounts per stay |
| `folio_items` | Individual charges posted to a folio |
| `payments` | Payments received against a folio |
| `housekeeping_tasks` | Cleaning and inspection tasks |
| `lost_and_found` | Lost items tracking |
| `suppliers` | Inventory suppliers |
| `inventory_items` | Stock items with levels |
| `stock_movements` | Stock in/out/adjustment log |
| `purchase_orders` | Orders raised to suppliers |
| `maintenance_orders` | Work orders for repairs |
| `assets` | Hotel asset register |
| `departments` | Staff departments |
| `staff` | Employee records (linked to users via user_id) |
| `shifts` | Staff shift scheduling |
| `leave_requests` | Annual/sick leave tracking |
| `audit_log` | All system actions logged |

## Key Design Decisions

- All monetary values stored in **kobo** (smallest NGN unit = 1/100 naira)
- Soft deletes on `guests`, `staff`, `rooms` (`is_deleted = false`)
- Auto-generated reference numbers via sequences + triggers:
  - `RES-YYYYMMDD-0001` for reservations
  - `FOL-YYYYMMDD-0001` for folios
  - `PAY-YYYYMMDD-0001` for payments
  - `WO-YYYYMMDD-0001` for work orders
  - `PO-YYYYMMDD-0001` for purchase orders
- `staff.user_id` links HR records to system login accounts
- Backend uses **service role key** which bypasses RLS — policies protect direct Supabase client access only
