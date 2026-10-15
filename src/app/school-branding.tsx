"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SchoolBranding() {
  useEffect(() => {
    async function loadBranding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("school_id").eq("id", user.id).single();
      if (!profile) return;
      const { data: school } = await supabase.from("schools").select("logo_url, background_url").eq("id", profile.school_id).single();
      if (school?.background_url) document.documentElement.style.setProperty("--school-background", `url(${school.background_url})`);
      if (school?.logo_url) document.documentElement.style.setProperty("--school-logo", `url(${school.logo_url})`);
    }
    loadBranding();
  }, []);
  return null;
}
