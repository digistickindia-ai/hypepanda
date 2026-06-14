"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export function useAdmin() {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, supabase: null, profile: null });

  useEffect(() => { (async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/app"); return; }
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (!profile || !profile.is_admin) { router.replace("/app/home"); return; }
    setState({ loading: false, supabase, profile });
  })(); }, []);

  return state;
}
