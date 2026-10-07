// Smoke-test: reads profiles via the service-role key from env.
// Run with:  npx tsx test-db.ts   (after putting keys in .env.local)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const { data: profiles, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', profiles, 'Error:', error);
}

test();
