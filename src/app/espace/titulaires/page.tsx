"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Teacher = { id: string; full_name: string };
type SchoolClass = { id: string; name: string; code: string };
type Assignment = { class_id: string; teacher_id: string; is_titular: boolean };

export default function TitularsPage() {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [form, setForm] = useState({ teacher_id: "", class_id: "", is_titular: true });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load(school: string) {
    const [teacherResult, classResult, assignmentResult] = await Promise.all([
      supabase.from("profiles").select("id, full_name").eq("school_id", school).eq("role", "teacher").eq("is_active", true).order("full_name"),
      supabase.from("classes").select("id, name, code").eq("school_id", school).order("name"),
      supabase.from("class_teachers").select("class_id, teacher_id, is_titular"),
    ]);
    if (teacherResult.error || classResult.error || assignmentResult.error) throw new Error("Impossible de charger les professeurs et les classes.");
    setTeachers(teacherResult.data ?? []); setClasses(classResult.data ?? []); setAssignments(assignmentResult.data ?? []);
  }

  useEffect(() => {
    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/connexion"); return; }
      const { data } = await supabase.from("profiles").select("school_id, role").eq("id", user.id).single();
      if (!data || data.role !== "school_admin") { router.replace("/espace"); return; }
      setSchoolId(data.school_id); await load(data.school_id);
    }
    start().catch((reason) => setError(reason instanceof Error ? reason.message : "Erreur de chargement."));
  }, [router]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    const { error: insertError } = await supabase.from("class_teachers").upsert({ class_id: form.class_id, teacher_id: form.teacher_id, is_titular: form.is_titular }, { onConflict: "class_id,teacher_id" });
    if (insertError) { setError(insertError.message); return; }
    setMessage("Professeur affecte a la classe."); setForm({ teacher_id: "", class_id: "", is_titular: true }); await load(schoolId);
  }

  const teacherName = (id: string) => teachers.find((teacher) => teacher.id === id)?.full_name ?? "Professeur";
  const className = (id: string) => classes.find((schoolClass) => schoolClass.id === id)?.name ?? "Classe";

  return <main className="private-shell"><header className="private-topbar"><Link className="brand" href="/espace"><span className="brand-mark">N</span><span>Noria</span></Link><Link className="sign-out" href="/espace">Retour au tableau de bord</Link></header><section className="private-content"><p className="section-kicker">Administration</p><h1>Professeurs.</h1><p className="private-lead">Affecter les comptes enseignants aux classes.</p>{error && <p className="form-message form-error">{error}</p>}{message && <p className="form-message form-success">{message}</p>}<form className="config-card config-card-wide" onSubmit={assign}><span className="card-index">Nouvelle affectation</span><h2>Ajouter un titulaire</h2><div className="form-row"><select required value={form.teacher_id} onChange={(event) => setForm({ ...form, teacher_id: event.target.value })}><option value="">Choisir le professeur</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}</select><select required value={form.class_id} onChange={(event) => setForm({ ...form, class_id: event.target.value })}><option value="">Choisir la classe</option>{classes.map((schoolClass) => <option key={schoolClass.id} value={schoolClass.id}>{schoolClass.name} · {schoolClass.code}</option>)}</select></div><label className="checkbox-line"><input type="checkbox" checked={form.is_titular} onChange={(event) => setForm({ ...form, is_titular: event.target.checked })} /> Titulaire principal de la classe</label><button className="submit-action" type="submit">Enregistrer l’affectation <span>→</span></button></form><div className="class-list"><div className="section-heading"><div><p className="section-kicker">Affectations actuelles</p><h2>{assignments.length} affectation{assignments.length === 1 ? "" : "s"}.</h2></div></div>{assignments.length === 0 ? <p className="muted-copy">Aucune affectation pour le moment. Les comptes enseignants doivent d’abord être créés dans Supabase Auth et profiles.</p> : <div className="class-list-grid">{assignments.map((assignment) => <article key={`${assignment.class_id}-${assignment.teacher_id}`}><span>{assignment.is_titular ? "Titulaire" : "Enseignant"}</span><strong>{teacherName(assignment.teacher_id)}</strong><small>{className(assignment.class_id)}</small></article>)}</div>}</div></section></main>;
}
