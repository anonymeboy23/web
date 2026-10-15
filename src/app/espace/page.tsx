"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type Role = "school_admin" | "teacher" | "student" | "parent";
type Profile = { full_name: string; role: Role; school_id: string };
type AcademicYear = { id: string; name: string; start_date: string; end_date: string; is_current: boolean };
type Level = { id: string; name: string };
type SchoolClass = { id: string; name: string; code: string; academic_year_id: string; level_id: string | null };

const roleNames: Record<Role, string> = { school_admin: "Administration de l’école", teacher: "Titulaire de classe", student: "Élève", parent: "Parent" };

export default function PrivateSpace() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "" });
  const [levelName, setLevelName] = useState("");
  const [classForm, setClassForm] = useState({ name: "", code: "", academic_year_id: "", level_id: "" });

  async function loadData(schoolId: string) {
    const [yearResult, levelResult, classResult] = await Promise.all([
      supabase.from("academic_years").select("id, name, start_date, end_date, is_current").eq("school_id", schoolId).order("start_date", { ascending: false }),
      supabase.from("levels").select("id, name").eq("school_id", schoolId).order("name"),
      supabase.from("classes").select("id, name, code, academic_year_id, level_id").eq("school_id", schoolId).order("name"),
    ]);
    const failedResult = [["annees scolaires", yearResult.error], ["niveaux", levelResult.error], ["classes", classResult.error]].find(([, queryError]) => queryError);
    if (failedResult) {
      const queryError = failedResult[1];
      const detail = typeof queryError === "string" ? queryError : queryError?.message;
      throw new Error(`Chargement ${failedResult[0]} impossible : ${detail ?? "erreur Supabase inconnue"}`);
    }
    setYears(yearResult.data ?? []);
    setLevels(levelResult.data ?? []);
    setClasses(classResult.data ?? []);
    if (!classForm.academic_year_id && yearResult.data?.[0]) setClassForm((current) => ({ ...current, academic_year_id: yearResult.data[0].id }));
  }

  useEffect(() => {
    async function loadSpace() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/connexion"); return; }
      const { data, error: profileError } = await supabase.from("profiles").select("full_name, role, school_id").eq("id", user.id).single();
      if (profileError || !data) { setError("Votre compte est connecté, mais son profil scolaire n’est pas encore configuré."); setIsLoading(false); return; }
      setProfile(data as Profile);
      if (data.role === "teacher") { router.replace("/espace/professeur"); return; }
      if (data.role !== "school_admin") { setIsLoading(false); return; }
      try { await loadData(data.school_id); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Erreur de chargement."); }
      setIsLoading(false);
    }
    loadSpace();
  // loadData depends only on the school id returned above.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function createYear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!profile) return;
    if (yearForm.end_date <= yearForm.start_date) { setError("La date de fin doit être après la date de début."); return; }
    const { data: createdYear, error: insertError } = await supabase.from("academic_years").insert({ ...yearForm, school_id: profile.school_id, is_current: years.length === 0 }).select("id").single();
    if (insertError || !createdYear) { setError(insertError?.message ?? "Année impossible à créer."); return; }
    const { error: termsError } = await supabase.from("terms").insert(["1ère période", "2ème période", "3ème période", "4ème période"].map((name) => ({ academic_year_id: createdYear.id, name, start_date: yearForm.start_date, end_date: yearForm.end_date })));
    if (termsError) { setError(`Année créée, mais périodes impossibles à créer : ${termsError.message}`); return; }
    setYearForm({ name: "", start_date: "", end_date: "" }); setMessage("Année scolaire créée."); await loadData(profile.school_id);
  }

  async function createLevel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!profile || !levelName.trim()) return;
    const { error: insertError } = await supabase.from("levels").insert({ name: levelName.trim(), school_id: profile.school_id });
    if (insertError) { setError(insertError.message); return; }
    setLevelName(""); setMessage("Niveau créé."); await loadData(profile.school_id);
  }

  async function createClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!profile) return;
    const { error: insertError } = await supabase.from("classes").insert({ name: classForm.name.trim(), code: classForm.code.trim(), academic_year_id: classForm.academic_year_id, level_id: classForm.level_id || null, school_id: profile.school_id });
    if (insertError) { setError(insertError.message); return; }
    setClassForm((current) => ({ ...current, name: "", code: "", level_id: "" })); setMessage("Classe créée."); await loadData(profile.school_id);
  }

  async function signOut() { await supabase.auth.signOut(); router.replace("/connexion"); }
  if (isLoading) return <main className="private-loading">Ouverture de votre espace…</main>;

  return <main className="private-shell">
    <header className="private-topbar"><Link className="brand" href="/"><span className="brand-mark">N</span><span>Noria</span></Link><button className="sign-out" onClick={signOut}>Se déconnecter</button></header>
    <section className="private-content">
      {profile?.role === "school_admin" && <div className="admin-toolbar"><Link className="toolbar-button" href="/espace/ecole">Identité de l’école <span>↗</span></Link><button className="toolbar-button" type="button" onClick={() => window.location.reload()}>Actualiser <span>↻</span></button></div>}
      {profile?.role === "school_admin" && <nav className="admin-nav" aria-label="Navigation administration"><Link className="admin-nav-link active" href="/espace">Vue d’ensemble <span>↗</span></Link><Link className="admin-nav-link" href="/espace/recherche">Rechercher <span>↗</span></Link><Link className="admin-nav-link" href="/espace/classes">Classes <span>↗</span></Link><Link className="admin-nav-link" href="/espace/matieres">Matières <span>↗</span></Link><Link className="admin-nav-link" href="/espace/notes">Notes <span>↗</span></Link><Link className="admin-nav-link" href="/espace/resultats">Résultats <span>↗</span></Link><Link className="admin-nav-link" href="/espace/eleves">Élèves <span>↗</span></Link><Link className="admin-nav-link" href="/espace/parents">Rattachements <span>↗</span></Link><Link className="admin-nav-link" href="/espace/professeurs">Professeurs <span>↗</span></Link><Link className="admin-nav-link" href="/espace/titulaires">Affectations <span>↗</span></Link></nav>}
      <p className="section-kicker">Espace sécurisé</p><h1>Bonjour{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1><p className="private-lead">{profile ? roleNames[profile.role] : "Profil non configuré"}</p>
      {error && <p className="form-message form-error" role="alert">{error}</p>}{message && <p className="form-message form-success" role="status">{message}</p>}
      {profile?.role === "school_admin" ? <>
        <div className="dashboard-grid"><article className="dashboard-card"><span>Classes</span><strong>{classes.length}</strong><small>Dans votre établissement</small></article><article className="dashboard-card"><span>Niveaux</span><strong>{levels.length}</strong><small>Référentiel scolaire</small></article><article className="dashboard-card"><span>Années scolaires</span><strong>{years.length}</strong><small>Configuration enregistrée</small></article></div>
        <div className="admin-forms dashboard-config-forms">
          <form className="config-card" onSubmit={createYear}><div><span className="card-index">01 · Année scolaire</span><h2>Ajouter une année</h2></div><input required placeholder="Ex. 2026–2027" value={yearForm.name} onChange={(event) => setYearForm({ ...yearForm, name: event.target.value })} /><div className="form-row"><input required type="date" value={yearForm.start_date} onChange={(event) => setYearForm({ ...yearForm, start_date: event.target.value })} /><input required type="date" value={yearForm.end_date} onChange={(event) => setYearForm({ ...yearForm, end_date: event.target.value })} /></div><button className="submit-action" type="submit">Créer l’année <span>→</span></button></form>
          <form className="config-card" onSubmit={createLevel}><div><span className="card-index">02 · Niveaux</span><h2>Ajouter un niveau</h2></div><input required placeholder="Ex. 6e primaire" value={levelName} onChange={(event) => setLevelName(event.target.value)} /><button className="submit-action" type="submit">Créer le niveau <span>→</span></button></form>
          <form className="config-card config-card-wide" onSubmit={createClass}><div><span className="card-index">03 · Classes</span><h2>Ajouter une classe</h2></div><div className="form-row"><input required placeholder="Nom de la classe" value={classForm.name} onChange={(event) => setClassForm({ ...classForm, name: event.target.value })} /><input required placeholder="Code unique" value={classForm.code} onChange={(event) => setClassForm({ ...classForm, code: event.target.value })} /></div><div className="form-row"><select required value={classForm.academic_year_id} onChange={(event) => setClassForm({ ...classForm, academic_year_id: event.target.value })}><option value="">Choisir une année</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.is_current ? " · active" : ""}</option>)}</select><select value={classForm.level_id} onChange={(event) => setClassForm({ ...classForm, level_id: event.target.value })}><option value="">Niveau (facultatif)</option>{levels.map((level) => <option key={level.id} value={level.id}>{level.name}</option>)}</select></div><button className="submit-action" type="submit">Créer la classe <span>→</span></button></form>
        </div>
        <div className="class-list"><div className="section-heading"><div><p className="section-kicker">Configuration actuelle</p><h2>Vos classes.</h2></div></div>{classes.length === 0 ? <p className="muted-copy">Aucune classe enregistrée pour le moment.</p> : <div className="class-list-grid">{classes.map((schoolClass) => <article key={schoolClass.id}><span>{schoolClass.code}</span><strong>{schoolClass.name}</strong><small>{years.find((year) => year.id === schoolClass.academic_year_id)?.name ?? "Année inconnue"}</small></article>)}</div>}</div>
      </> : <div className="empty-space-card"><span className="card-index">Votre espace</span><h2>Votre espace sera bientôt disponible.</h2><p>L’école publiera ici les informations, résultats et communications liés à votre rôle.</p></div>}
    </section>
  </main>;
}
