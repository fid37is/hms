// scripts/seedSuperAdmin.js
//
// Run once in production to create the platform super admin.
// Usage:
//   node scripts/seedSuperAdmin.js
//
// Or with custom credentials via env:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=secret ADMIN_NAME="Your Name" node scripts/seedSuperAdmin.js

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load .env from backend root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL        = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // must use service role to bypass RLS

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL    = process.env.ADMIN_EMAIL    || 'admin@cierlo.com';
const PASSWORD = process.env.ADMIN_PASSWORD || 'CierloAdmin2025!';
const NAME     = process.env.ADMIN_NAME     || 'Super Admin';

async function seed() {
  console.log(`\n🔧  Seeding super admin: ${EMAIL}\n`);

  // Check if already exists
  const { data: existing } = await supabase
    .from('platform_admins')
    .select('id, email')
    .eq('email', EMAIL.toLowerCase().trim())
    .single();

  if (existing) {
    console.log(`⚠️   Admin already exists: ${existing.email} (${existing.id})`);
    console.log('    To reset the password, run with a new ADMIN_EMAIL or update directly in Supabase.\n');
    process.exit(0);
  }

  // Hash password
  const password_hash = await bcrypt.hash(PASSWORD, 12);

  // Insert
  const { data, error } = await supabase
    .from('platform_admins')
    .insert({
      email:         EMAIL.toLowerCase().trim(),
      full_name:     NAME,
      password_hash,
      is_active:     true,
    })
    .select('id, email, full_name')
    .single();

  if (error) {
    console.error('❌  Failed to create admin:', error.message);
    process.exit(1);
  }

  console.log('✅  Super admin created successfully!');
  console.log(`    ID:    ${data.id}`);
  console.log(`    Email: ${data.email}`);
  console.log(`    Name:  ${data.full_name}`);
  console.log(`\n    Login at: /super-admin/login`);
  console.log(`    Email:    ${EMAIL}`);
  console.log(`    Password: ${PASSWORD}`);
  console.log(`\n⚠️   Change the password immediately after first login.\n`);
}

seed().catch(err => {
  console.error('❌  Unexpected error:', err.message);
  process.exit(1);
});