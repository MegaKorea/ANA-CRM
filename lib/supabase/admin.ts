import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { EnvKey, getRequiredEnv } from '@/config/env.config';

export function createAdminClient(): SupabaseClient<Database, 'public'> {
  return createClient<Database, 'public'>(
    getRequiredEnv(EnvKey.SUPABASE_URL),
    getRequiredEnv(EnvKey.SERVICE_ROLE_KEY),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

