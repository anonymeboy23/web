import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const body = await request.json() as { full_name?: string; school_name?: string; email?: string; password?: string; phone?: string };
  const fullName = body.full_name?.trim(); const schoolName = body.school_name?.trim(); const email = body.email?.trim().toLowerCase(); const password = body.password;
  if (!fullName || !schoolName || !email || !password || password.length < 8) return NextResponse.json({ error: "Nom, école, email et mot de passe (8 caractères minimum) sont obligatoires." }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!url || !key) return NextResponse.json({ error: "Configuration serveur Supabase incomplète." }, { status: 500 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.admin.createUser({ email, password, email_confirm: true }); if (userError || !userData.user) return NextResponse.json({ error: userError?.message ?? "Compte impossible à créer." }, { status: 400 });
  const { data: school, error: schoolError } = await admin.from("schools").insert({ name: schoolName, phone: body.phone?.trim() || null, email }).select("id").single(); if (schoolError || !school) { await admin.auth.admin.deleteUser(userData.user.id); return NextResponse.json({ error: schoolError?.message ?? "École impossible à créer." }, { status: 400 }); }
  const { error: profileError } = await admin.from("profiles").insert({ id: userData.user.id, school_id: school.id, full_name: fullName, phone: body.phone?.trim() || null, role: "school_admin" }); if (profileError) { await admin.from("schools").delete().eq("id", school.id); await admin.auth.admin.deleteUser(userData.user.id); return NextResponse.json({ error: profileError.message }, { status: 400 }); }
  return NextResponse.json({ ok: true });
}
