import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || supabaseUrl === 'your_supabase_project_url') {
  console.warn(
    '[Fintrack] Supabase is not configured.\n' +
    '1. Local: Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    '2. Deployed: Add these same variables to your deployment platform (Vercel/Netlify).'
  );
}

// Use placeholder values so the app doesn't crash before credentials are added
export const supabase = createClient(
  supabaseUrl?.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
