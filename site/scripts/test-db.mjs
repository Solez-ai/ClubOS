import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqekafdcxzipxmbybxmn.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

console.log('Testing Supabase Connection...');
const supabase = createClient(url, serviceKey);

async function main() {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' });
    console.log('Query result:', { data, error });
  } catch (err) {
    console.error('Error testing supabase:', err);
  }
}

main();
