"use client";
import { createBrowserClient } from "@supabase/ssr";
import { demoClient, isDemo } from "@/lib/demo";

let client: ReturnType<typeof createBrowserClient> | null = null;
let demo: any = null;

export function supabaseBrowser(): ReturnType<typeof createBrowserClient> {
  if (isDemo()) {
    if (!demo) demo = demoClient();
    return demo;
  }
  if (!client) {
    client = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return client;
}
