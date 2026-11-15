/*
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables in setup.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
*/

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment check failed:', {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasSecretKey: Boolean(process.env.SUPABASE_SECRET_KEY),
    hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY)
  });
  throw new Error('Missing Supabase environment variables in setup.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;