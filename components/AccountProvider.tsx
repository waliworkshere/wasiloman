"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DEMO_ACCOUNT, isDemo } from "@/lib/demo";

export type SafeAccount = {
  waba_id: string;
  phone_number_id: string;
  display_phone: string | null;
  verified_name: string | null;
  connected_via: string;
  created_at: string;
} | null;

type Ctx = { demo: boolean; userId: string | null; email: string | null; account: SafeAccount; loading: boolean; refresh: () => Promise<void> };
const AccountCtx = createContext<Ctx>({ demo: false, userId: null, email: null, account: null, loading: true, refresh: async () => {} });

export function AccountProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<Ctx, "refresh">>({ demo: false, userId: null, email: null, account: null, loading: true });

  const refresh = useCallback(async () => {
    if (isDemo()) return setState({ demo: true, userId: "demo-user", email: "demo@wasil.om", account: DEMO_ACCOUNT, loading: false });
    const sb = supabaseBrowser();
    const { data } = await sb.auth.getUser();
    if (!data.user) return setState({ demo: false, userId: null, email: null, account: null, loading: false });
    // Never select the access token in the browser
    const { data: account } = await sb
      .from("whatsapp_accounts")
      .select("waba_id, phone_number_id, display_phone, verified_name, connected_via, created_at")
      .maybeSingle();
    setState({ demo: false, userId: data.user.id, email: data.user.email ?? null, account: account ?? null, loading: false });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <AccountCtx.Provider value={{ ...state, refresh }}>{children}</AccountCtx.Provider>;
}

export const useAccount = () => useContext(AccountCtx);
