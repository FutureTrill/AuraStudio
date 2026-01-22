
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Hardcoded provided credentials for immediate backend integration
const supabaseUrl = 'https://dsskcarhhhqgirlilfua.supabase.co';
const supabaseAnonKey = 'sb_publishable_vL2yEBwIu80oi75r1JVFNg_ne83yZUw';

// Create client with the provided project credentials
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn("Supabase configuration is missing. Authentication and cloud sync features will be disabled.");
}
