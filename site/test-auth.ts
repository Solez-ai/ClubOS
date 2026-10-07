import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xqekafdcxzipxmbybxmn.supabase.co',
  'sb_publishable_QYtvpGKBDs8ErSi3dY-FgA_4lyH3Bkj' // Actually in .env.local it is NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const email = 'test' + Date.now() + '@example.com';
  console.log('Testing with email:', email);
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'password123',
    options: {
        data: {
            role: 'participant',
            full_name: 'Test User',
            institution: 'Test Inst'
        }
    }
  });
  console.log('SignUp:', { data, error });
  
  if (data?.user) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'password123'
    });
    console.log('SignIn:', { signInData, signInError });
  }
}

test();
