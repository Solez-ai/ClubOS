import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface EnsureProfileResult {
  ok: boolean;
  /** True when the row could not be created because DB setup is incomplete (RLS/trigger missing). */
  setupIncomplete?: boolean;
  error?: string;
}

export const DB_SETUP_HINT =
  'Database setup incomplete: the profile could not be created. Run SQL/05_auth_fixes.sql in the Supabase SQL editor, then sign in again.';

/**
 * Self-heals a missing profile row for the signed-in user.
 *
 * The handle_new_user() DB trigger normally creates the profile during
 * signUp(), but on databases where the trigger was never applied (or the row
 * was lost during earlier broken signups) every page that reads the profile
 * would treat the user as logged out / unauthorized. This helper upserts the
 * row from the auth user's metadata so those accounts heal themselves on the
 * next login or page load.
 */
export async function ensureProfile(
  supabase: SupabaseClient,
  user: User
): Promise<EnsureProfileResult> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return { ok: true };

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const email = user.email ?? '';
  const baseHandle =
    email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24) || 'user';

  // handle is UNIQUE — add a numeric suffix on collision.
  let handle = baseHandle;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', handle)
      .maybeSingle();
    if (!taken) break;
    handle = `${baseHandle}${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  const role = meta.role === 'organizer' ? 'organizer' : 'participant';

  const { error } = await supabase.from('profiles').upsert(
    {
      id: user.id,
      handle,
      full_name: typeof meta.full_name === 'string' ? meta.full_name : '',
      email,
      role,
      phone: typeof meta.phone === 'string' && meta.phone ? meta.phone : null,
      institution:
        typeof meta.institution === 'string' && meta.institution ? meta.institution : null,
      onboarded: true,
    },
    { onConflict: 'id' }
  );

  if (error) {
    // 42501 = insufficient_privilege (RLS blocked the insert → setup incomplete)
    return { ok: false, setupIncomplete: error.code === '42501', error: error.message };
  }
  return { ok: true };
}
