// Supabase client — safe to import even if the package isn't installed yet.
// Once you run `npm install @supabase/supabase-js`, this activates automatically.

let supabase: ReturnType<typeof import("@supabase/supabase-js").createClient> | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch {
  // Package not installed yet — app runs in localStorage-only mode
}

export { supabase };
