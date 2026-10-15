import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  if (!url || !publishableKey || !serviceRoleKey) return NextResponse.json({ error: "Configuration serveur Supabase incomplete." }, { status: 500 });
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Session manquante." }, { status: 401 });

  const authClient = createClient(url, publishableKey);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);
  if (userError || !user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });

  const adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: requester, error: requesterError } = await adminClient.from("profiles").select("school_id, role").eq("id", user.id).single();
  if (requesterError || requester?.role !== "school_admin") return NextResponse.json({ error: "Droits administrateur requis." }, { status: 403 });

  const body = await request.json() as { email?: string; password?: string; full_name?: string; phone?: string; login_id?: string };
  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim();
  const loginId = body.login_id?.trim();
  if (!email || !body.password || !fullName || !loginId || body.password.length < 8) return NextResponse.json({ error: "ID, email, nom et mot de passe de 8 caracteres minimum requis." }, { status: 400 });

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password: body.password, email_confirm: true, user_metadata: { full_name: fullName, role: "teacher" } });
  if (createError || !created.user) return NextResponse.json({ error: createError?.message ?? "Creation du compte impossible." }, { status: 400 });

  const { error: profileError } = await adminClient.from("profiles").insert({ id: created.user.id, school_id: requester.school_id, login_id: loginId, full_name: fullName, phone: body.phone?.trim() || null, role: "teacher", is_active: true });
  if (profileError) { await adminClient.auth.admin.deleteUser(created.user.id); return NextResponse.json({ error: `Compte annule : ${profileError.message}` }, { status: 400 }); }
  return NextResponse.json({ id: created.user.id, full_name: fullName });
}
