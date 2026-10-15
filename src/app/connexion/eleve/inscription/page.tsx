"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type AccountType = "student" | "parent";

export default function StudentParentRegistrationPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [studentNumber, setStudentNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("Parent/tuteur");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function linkSchoolRecord(role: AccountType) {
    const { data, error: linkError } = await supabase.rpc("register_portal_account", {
      p_student_number: studentNumber.trim(),
      p_role: role,
      p_full_name: role === "parent" ? fullName.trim() : null,
      p_relationship: relationship,
    });
    if (linkError) throw new Error(linkError.message);
    return data;
  }

  async function finishRegistration(role: AccountType) {
    const state = await linkSchoolRecord(role);
    if (state === "parent_pending") {
      setMessage("Compte créé. La demande de rattachement doit être validée par l’administration de l’école.");
      router.push("/espace/eleve");
      router.refresh();
    } else if (state === "student_pending") {
      await supabase.auth.signOut();
      setMessage("Demande envoyée. Vous pourrez vous connecter dès que l’administration aura validé le rattachement à votre dossier.");
    } else {
      router.push("/espace/eleve");
      router.refresh();
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { data: { session: existingSession } } = await supabase.auth.getSession();
    if (existingSession) {
      try { await finishRegistration(accountType); }
      catch (reason) { setError(reason instanceof Error ? reason.message : "Association au dossier scolaire impossible."); }
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { full_name: fullName.trim(), relationship } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setMessage("Un email de confirmation a été envoyé. Après confirmation, connectez-vous avec votre email, votre mot de passe et l’identifiant scolaire pour terminer le rattachement.");
      setLoading(false);
      return;
    }

    try {
      await finishRegistration(accountType);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Association au dossier scolaire impossible.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><section className="auth-panel auth-intro"><Link className="brand auth-brand" href="/"><span className="brand-mark">N</span><span>Noria</span></Link><div className="auth-intro-copy"><p className="eyebrow"><span /> Espace élève &amp; parent</p><h1>Votre compte, relié à l’école.</h1><p>Utilisez l’identifiant qui vous a été remis par l’établissement.</p></div></section><section className="auth-panel auth-form-panel"><Link className="back-link" href="/connexion/eleve">← Retour à la connexion</Link><div className="login-card registration-card"><p className="section-kicker">Créer un compte</p><h2>Inscription.</h2><div className="segmented-tabs" role="group" aria-label="Type de compte"><button className={accountType === "student" ? "active" : ""} type="button" onClick={() => setAccountType("student")}>Élève</button><button className={accountType === "parent" ? "active" : ""} type="button" onClick={() => setAccountType("parent")}>Parent</button></div><p className="form-lead">L’identifiant est fourni par l’école. L’administration valide le rattachement avant l’accès au portail.</p><form onSubmit={submit}><label htmlFor="student-number">Identifiant de l’élève fourni par l’école</label><input id="student-number" autoComplete="off" required value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="Ex. EL-2026-014" />{accountType === "parent" && <><label htmlFor="full-name">Votre nom complet</label><input id="full-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Nom du parent ou tuteur" /><label htmlFor="relationship">Lien avec l’élève</label><select id="relationship" value={relationship} onChange={(event) => setRelationship(event.target.value)}><option>Parent/tuteur</option><option>Mère</option><option>Père</option><option>Tuteur légal</option></select></>}<label htmlFor="registration-email">Votre email</label><input id="registration-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@exemple.com" /><label htmlFor="registration-password">Créer un mot de passe</label><input id="registration-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8 caractères minimum" />{error && <p className="form-message form-error" role="alert">{error}</p>}{message && <p className="form-message form-success" role="status">{message}</p>}<button className="submit-action" type="submit" disabled={loading}>{loading ? "Création du compte…" : "Créer mon compte"}<span aria-hidden="true">→</span></button></form><p className="auth-help">Déjà inscrit ? <Link href="/connexion/eleve">Se connecter</Link></p></div></section></main>;
}