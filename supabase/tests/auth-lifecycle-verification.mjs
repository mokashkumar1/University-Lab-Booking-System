import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Supabase server credentials are required for this verification.');

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const email = `lifecycle-qa-${crypto.randomUUID()}@example.invalid`;
let userId;

try {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: `Lifecycle-${crypto.randomUUID()}-Password`,
    email_confirm: true,
    user_metadata: { name: 'Lifecycle QA' },
  });
  if (error || !data.user) throw error || new Error('Test account was not created.');
  userId = data.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,name,email,role,active')
    .eq('id', userId)
    .single();
  if (profileError) throw profileError;
  if (profile.name !== 'Lifecycle QA' || profile.email !== email || profile.role !== 'Student' || !profile.active) {
    throw new Error('New-account profile did not receive the expected Student lifecycle defaults.');
  }
  console.log('Verified live account provisioning trigger.');
} finally {
  if (userId) {
    await supabase.from('profiles').delete().eq('id', userId);
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
  }
}
