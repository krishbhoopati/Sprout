import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase config. Set VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env (see .env.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
