"use strict";
// Smoke-test: reads profiles via the service-role key from env.
// Run with:  node test-db.js   (after putting keys in .env.local, or export them in the shell)
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
  process.exit(1);
}

const supabase = (0, supabase_js_1.createClient)(supabaseUrl, serviceKey);

async function test() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles, 'Error:', error);
}

test();
