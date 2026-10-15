import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !publishableKey || !serviceRoleKey) return NextResponse.json({ error: "Configuration serveur Supabase incomplete." }, { status: 500 });
  if (!token) return NextResponse.json({ error: "Session manquante." }, { status: 401 });
  const authClient = createClient(url, publishableKey);
  const { data: { user }, error: authError } = await authClient.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: requester } = await admin.from("profiles").select("school_id, role").eq("id", user.id).single();
  if (!requester || requester.role !== "school_admin") return NextResponse.json({ error: "Droits administrateur requis." }, { status: 403 });
  const body = await request.json() as { entity?: "teacher" | "student" | "class"; id?: string; action?: "archive" | "delete" };
  if (!body.entity || !body.id || !body.action) return NextResponse.json({ error: "Action incomplete." }, { status: 400 });

  if (body.entity === "teacher") {
    const { data: teacher } = await admin.from("profiles").select("id, is_active").eq("id", body.id).eq("school_id", requester.school_id).eq("role", "teacher").single();
    if (!teacher) return NextResponse.json({ error: "Professeur introuvable." }, { status: 404 });
    if (body.action === "archive") {
      const { error } = await admin.from("profiles").update({ is_active: false }).eq("id", teacher.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    await admin.from("class_teachers").delete().eq("teacher_id", teacher.id);
    const { error: profileError } = await admin.from("profiles").delete().eq("id", teacher.id);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    const { error: authDeleteError } = await admin.auth.admin.deleteUser(teacher.id);
    if (authDeleteError) return NextResponse.json({ error: `Profil supprime, compte Auth non supprime : ${authDeleteError.message}` }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.entity === "class") {
    const { data: schoolClass } = await admin.from("classes").select("id, status").eq("id", body.id).eq("school_id", requester.school_id).single();
    if (!schoolClass) return NextResponse.json({ error: "Classe introuvable." }, { status: 404 });
    if (body.action === "archive") {
      const { error } = await admin.from("classes").update({ status: "inactive" }).eq("id", schoolClass.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    const { count } = await admin.from("enrollments").select("id", { count: "exact", head: true }).eq("class_id", schoolClass.id);
    if ((count ?? 0) > 0) return NextResponse.json({ error: "Cette classe contient encore des eleves. Archive-la au lieu de la supprimer." }, { status: 400 });
    await admin.from("class_teachers").delete().eq("class_id", schoolClass.id);
    const { error } = await admin.from("classes").delete().eq("id", schoolClass.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const { data: student } = await admin.from("students").select("id, auth_user_id").eq("id", body.id).eq("school_id", requester.school_id).single();
  if (!student) return NextResponse.json({ error: "Eleve introuvable." }, { status: 404 });
  if (body.action === "archive") {
    const { error } = await admin.from("students").update({ status: "inactive" }).eq("id", student.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  await admin.from("enrollments").delete().eq("student_id", student.id);
  await admin.from("student_parents").delete().eq("student_id", student.id);
  const { error: studentError } = await admin.from("students").delete().eq("id", student.id);
  if (studentError) return NextResponse.json({ error: `Suppression impossible : ${studentError.message}` }, { status: 400 });
  if (student.auth_user_id) await admin.auth.admin.deleteUser(student.auth_user_id);
  return NextResponse.json({ ok: true });
}
