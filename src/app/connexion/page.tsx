"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("email not confirmed")) {
        setErrorMessage("Cet email n’est pas encore confirmé dans Supabase.");
      } else if (message.includes("invalid login credentials")) {
        setErrorMessage("Email ou mot de passe incorrect.");
      } else {
        setErrorMessage(`Connexion impossible : ${error.message}`);
      }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const profileResponse = session ? await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${session.access_token}` } }) : null;
      const profileResult = profileResponse ? await profileResponse.json() as { profile?: { role: string }; error?: string } : { error: "Session introuvable." };
      if (!profileResponse?.ok || profileResult.profile?.role !== "school_admin") {
        await supabase.auth.signOut();
        setErrorMessage(profileResult.error ?? "Ce compte n’est pas un compte administrateur actif.");
      } else {
        router.push("/espace");
        router.refresh();
      }
    }

    setIsLoading(false);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel auth-intro">
        <Link className="brand auth-brand" href="/">
          <span className="brand-mark">N</span>
          <span>Noria</span>
        </Link>
        <div className="auth-intro-copy">
          <p className="eyebrow"><span /> Votre espace scolaire</p>
          <h1>Un accès simple à ce qui compte.</h1>
          <p>Retrouvez les informations de votre établissement dans un espace conçu pour rester clair, sûr et humain.</p>
        </div>
        <p className="auth-footer-note">Gestion scolaire, avec justesse.</p>
      </section>

      <section className="auth-panel auth-form-panel">
        <Link className="back-link" href="/">← Retour à l’accueil</Link>
        <div className="login-card">
          <p className="section-kicker">Connexion sécurisée</p>
          <h2>Bienvenue.</h2>
          <p className="form-lead">Utilisez l’adresse email associée à votre compte administrateur.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="identifier">Adresse email</label>
            <input id="identifier" name="identifier" type="email" autoComplete="email" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="vous@ecole.fr" />
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Votre mot de passe" />
            {errorMessage && <p className="form-message form-error" role="alert">{errorMessage}</p>}
            {successMessage && <p className="form-message form-success" role="status">{successMessage}</p>}
            <button className="submit-action" type="submit" disabled={isLoading}>{isLoading ? "Connexion..." : "Entrer dans mon espace"}<span aria-hidden="true">→</span></button>
          </form>
          <p className="auth-help"><Link href="/connexion/mot-de-passe-oublie">Mot de passe oublié ?</Link><br /><Link href="/inscription/admin">Créer un compte administrateur</Link><br /><Link href="/connexion/professeur">Connexion professeur</Link></p>
          <p className="auth-help">Un problème d’accès ? Contactez directement l’administration de votre école.</p>
        </div>
      </section>
    </main>
  );
}
