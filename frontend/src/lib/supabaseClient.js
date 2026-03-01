// Lightweight Supabase client for auth flows only (reset password)
// Keys are public-safe (anon key only)
import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);