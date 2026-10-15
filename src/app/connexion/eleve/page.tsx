"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function StudentParentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [accountType, setAccountType] = useState<"student" | "parent">("student");
  const [relationship, setRelationship] = useState("Parent/tuteur");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true); await supabase.auth.signOut();
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) { setError("Identifiant ou mot de passe incorrect."); setLoading(false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const response = session ? await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${session.access_token}` } }) : null;
    const result = response ? await response.json() as { profile?: { role: string }; error?: string } : { error: "Session introuvable." };
    if (!response?.ok && studentNumber.trim()) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: linkState, error: linkError } = await supabase.rpc("register_portal_account", {
        p_student_number: studentNumber.trim(),
        p_role: accountType,
        p_full_name: typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
        p_relationship: typeof user?.user_metadata?.relationship === "string" ? user.user_metadata.relationship : relationship,
      });
      if (linkError) { setError(linkError.message); setLoading(false); return; }
      if (linkState === "student_pending") {
        await supabase.auth.signOut();
        setError("Votre demande est en attente de validation par l’administration de l’école.");
        setLoading(false);
        return;
      }
      if (linkState) { router.push("/espace/eleve"); router.refresh(); return; }
    }
    if (!response?.ok || !["student", "parent"].includes(result.profile?.role ?? "")) {
      await supabase.auth.signOut(); setError("Ce compte n’est pas un compte élève ou parent."); setLoading(false); return;
    }
    router.push("/espace/eleve"); router.refresh();
  }

  return <main className="auth-shell"><section className="auth-panel auth-intro"><Link className="brand auth-brand" href="/"><span className="brand-mark">N</span><span>Noria</span></Link><div className="auth-intro-copy"><p className="eyebrow"><span /> Espace élève &amp; parent</p><h1>Vos résultats, en toute clarté.</h1><p>Consultez uniquement les résultats publiés par votre établissement.</p></div></section><section className="auth-panel auth-form-panel"><Link className="back-link" href="/">← Retour à l’accueil</Link><div className="login-card"><p className="section-kicker">Connexion élève / parent</p><h2>Bienvenue.</h2><p className="form-lead">Utilisez l’identifiant remis par l’école.</p><form onSubmit={submit}><label htmlFor="email">Adresse email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@ecole.fr" /><label htmlFor="password">Mot de passe</label><input id="password" type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" />
          <label htmlFor="school-identifier">Identifiant scolaire (pour terminer une inscription)</label><input id="school-identifier" autoComplete="off" value={studentNumber} onChange={(event) => setStudentNumber(event.target.value)} placeholder="Facultatif si déjà rattaché" />
          <label htmlFor="account-type">Type de compte à rattacher</label><select id="account-type" value={accountType} onChange={(event) => setAccountType(event.target.value as "student" | "parent")}><option value="student">Élève</option><option value="parent">Parent</option></select>
          {accountType === "parent" && <><label htmlFor="relationship">Lien avec l’élève</label><select id="relationship" value={relationship} onChange={(event) => setRelationship(event.target.value)}><option>Parent/tuteur</option><option>Mère</option><option>Père</option><option>Tuteur légal</option></select></>}
          {error && <p className="form-message form-error" role="alert">{error}</p>}
          <button className="submit-action" type="submit" disabled={loading}>{loading ? "Connexion..." : "Accéder à mon espace"}<span>→</span></button></form><p className="auth-help"><Link href="/connexion/mot-de-passe-oublie">Mot de passe oublié ?</Link><br /><Link href="/connexion/eleve/inscription">Créer un compte élève ou parent</Link><br /><Link href="/connexion">Connexion administration</Link><br /><Link href="/connexion/professeur">Connexion professeur</Link></p></div></section></main>;
}
