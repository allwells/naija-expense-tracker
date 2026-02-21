import { createClient } from "@supabase/supabase-js";

// Server client (service role — server actions and API routes only)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: ((reqUrl: string | URL | Request, options: RequestInit) => {
        return fetch(reqUrl, { ...options, cache: "no-store" });
      }) as typeof fetch,
    },
  });
}

// Browser client (anon key — client components only)
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}
