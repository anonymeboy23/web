import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { subjectCode, subjectsForClass, curriculumOptions } from "@/lib/curriculum";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !url || !publishableKey || !serviceKey) return NextResponse.json({ error: "Configuration serveur Supabase incomplète." }, { status: 500 });
  const publicClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } }); const { data: userData, error: userError } = await publicClient.auth.getUser(token); if (userError || !userData.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } }); const { data: profile, error: profileError } = await admin.from("profiles").select("school_id, role, is_active").eq("id", userData.user.id).single(); if (profileError || !profile || profile.role !== "school_admin" || !profile.is_active) return NextResponse.json({ error: "Accès administrateur refusé." }, { status: 403 });
  const names = new Set<string>(); const levels = ["1re maternelle", "2e maternelle", "3e maternelle", "1re primaire", "2e primaire", "3e primaire", "4e primaire", "5e primaire", "6e primaire", "7e", "8e", "1re humanités", "2e humanités", "3e humanités", "4e humanités"];
  for (const level of levels) { const cycle = level.includes("maternelle") ? "Maternelle" : level.includes("primaire") ? "Primaire" : level === "7e" || level === "8e" ? "Éducation de base" : "Humanités"; for (const name of subjectsForClass(cycle, "", level)) names.add(name); }
  for (const section of Object.keys(curriculumOptions)) for (const option of curriculumOptions[section]) for (const name of subjectsForClass("Humanités", option, "3e humanités")) names.add(name);
  const rows = Array.from(names).map((name) => ({ school_id: profile.school_id, name, code: subjectCode(name), default_coefficient: 1 })); const { error: upsertError } = await admin.from("subjects").upsert(rows, { onConflict: "school_id,code" }); if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 400 });
  return NextResponse.json({ ok: true, count: rows.length });
}
