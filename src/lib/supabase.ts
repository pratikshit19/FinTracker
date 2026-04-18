import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.warn(
    '[Fintrack] Supabase is not configured.\n' +
    'Copy .env.example → .env and fill in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Use placeholder values so the app doesn't crash before credentials are added
export const supabase = createClient(
  supabaseUrl?.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
