// Smoke-test: creates a user via the service-role key from env to exercise the
// handle_new_user() trigger.
// Run with:  node test-trigger.js   (after putting keys in .env.local)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function test() {
  const email = 'admin' + Date.now() + '@example.com';
  console.log('Creating user:', email);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    user_metadata: { role: 'participant', full_name: 'Admin Test' },
    email_confirm: true,
  });
  console.log('User created:', data?.user?.id);
  console.log('CreateUser error:', error);
}

test();
