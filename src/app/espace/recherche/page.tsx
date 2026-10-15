"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Year = { id: string; name: string; is_current: boolean };
type Student = { id: string; student_number: string; full_name: string; birth_date: string | null; status: string };
type Teacher = { id: string; login_id: string | null; full_name: string; phone: string | null; is_active: boolean };
type Enrollment = { student_id: string; academic_year_id: string; class_id: string; classes: { name: string; code: string } | { name: string; code: string }[] | null };
type TeacherAssignment = { teacher_id: string; class_id: string; classes: { academic_year_id: string } | { academic_year_id: string }[] | null };

export default function SearchPage() {
  const router = useRouter();
  const [years, setYears] = useState<Year[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [yearId, setYearId] = useState("");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"students" | "teachers">("students");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/connexion"); return; }
      const { data: profile } = await supabase.from("profiles").select("school_id, role").eq("id", user.id).single();
      if (!profile || profile.role !== "school_admin") { router.replace("/espace"); return; }
      const [yearResult, studentResult, teacherResult, enrollmentResult, assignmentResult] = await Promise.all([
        supabase.from("academic_years").select("id, name, is_current").eq("school_id", profile.school_id).order("start_date", { ascending: false }),
        supabase.from("students").select("id, student_number, full_name, birth_date, status").eq("school_id", profile.school_id).order("full_name"),
        supabase.from("profiles").select("id, login_id, full_name, phone, is_active").eq("school_id", profile.school_id).eq("role", "teacher").order("full_name"),
        supabase.from("enrollments").select("student_id, academic_year_id, class_id, classes(name, code)").order("enrolled_at", { ascending: false }),
        supabase.from("class_teachers").select("teacher_id, class_id, classes(academic_year_id)"),
      ]);
      const failed = [yearResult.error, studentResult.error, teacherResult.error, enrollmentResult.error, assignmentResult.error].find(Boolean);
      if (failed) { setError(failed.message); return; }
      setYears(yearResult.data ?? []); setStudents(studentResult.data ?? []); setTeachers(teacherResult.data ?? []); setEnrollments((enrollmentResult.data ?? []) as Enrollment[]); setTeacherAssignments((assignmentResult.data ?? []) as TeacherAssignment[]);
      if (yearResult.data?.find((year) => year.is_current)) setYearId(yearResult.data.find((year) => year.is_current)?.id ?? "");
    }
    load().catch((reason) => setError(reason instanceof Error ? reason.message : "Erreur de chargement."));
  }, [router]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredStudents = useMemo(() => students.filter((student) => {
    const enrollment = enrollments.find((item) => item.student_id === student.id && (!yearId || item.academic_year_id === yearId));
    const matchesYear = !yearId || Boolean(enrollment);
    const matchesQuery = !normalizedQuery || `${student.full_name} ${student.student_number}`.toLowerCase().includes(normalizedQuery);
    return matchesYear && matchesQuery;
  }), [students, enrollments, yearId, normalizedQuery]);
  const filteredTeachers = useMemo(() => teachers.filter((teacher) => {
    const matchesYear = !yearId || teacherAssignments.some((assignment) => {
      const classRelation = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes;
      return assignment.teacher_id === teacher.id && classRelation?.academic_year_id === yearId;
    });
    const matchesQuery = !normalizedQuery || `${teacher.full_name} ${teacher.login_id ?? ""} ${teacher.id} ${teacher.phone ?? ""}`.toLowerCase().includes(normalizedQuery);
    return matchesYear && matchesQuery;
  }), [teachers, teacherAssignments, yearId, normalizedQuery]);
  const classFor = (studentId: string) => {
    const relation = enrollments.find((item) => item.student_id === studentId && (!yearId || item.academic_year_id === yearId))?.classes;
    return Array.isArray(relation) ? relation[0] : relation;
  };

  return <main className="private-shell"><header className="private-topbar"><Link className="brand" href="/espace"><span className="brand-mark">N</span><span>Noria</span></Link><Link className="sign-out" href="/espace">Retour au tableau de bord</Link></header><section className="private-content"><p className="section-kicker">Administration · Registres</p><h1>Rechercher.</h1><p className="private-lead">Retrouver rapidement un eleve ou un professeur.</p>{error && <p className="form-message form-error">{error}</p>}<div className="search-toolbar"><input className="search-input" placeholder="Nom, matricule, téléphone ou identifiant" value={query} onChange={(event) => setQuery(event.target.value)} /><select value={yearId} onChange={(event) => setYearId(event.target.value)}><option value="">Toutes les années</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? " · active" : ""}</option>)}</select></div><div className="search-tabs"><button className={view === "students" ? "search-tab active" : "search-tab"} onClick={() => setView("students")}>Élèves · {filteredStudents.length}</button><button className={view === "teachers" ? "search-tab active" : "search-tab"} onClick={() => setView("teachers")}>Professeurs · {filteredTeachers.length}</button></div>{view === "students" ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Matricule</th><th>Nom complet</th><th>Classe</th><th>Date de naissance</th><th>Statut</th></tr></thead><tbody>{filteredStudents.map((student) => <tr key={student.id}><td><strong>{student.student_number}</strong></td><td>{student.full_name}</td><td>{classFor(student.id) ? `${classFor(student.id)?.name} · ${classFor(student.id)?.code}` : "Non inscrit"}</td><td>{student.birth_date || "—"}</td><td><span className="table-status">{student.status}</span></td></tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="muted-copy table-empty">Aucun eleve ne correspond a la recherche.</p>}</div> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Id ecole</th><th>Nom complet</th><th>UUID Auth</th><th>Téléphone</th><th>Statut</th></tr></thead><tbody>{filteredTeachers.map((teacher) => <tr key={teacher.id}><td><strong>{teacher.login_id || "—"}</strong></td><td>{teacher.full_name}</td><td><code>{teacher.id}</code></td><td>{teacher.phone || "—"}</td><td><span className="table-status">{teacher.is_active ? "Actif" : "Inactif"}</span></td></tr>)}</tbody></table>{filteredTeachers.length === 0 && <p className="muted-copy table-empty">Aucun professeur ne correspond a la recherche.</p>}</div>}</section></main>;
}
