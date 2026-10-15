"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setMessage(""); const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/connexion/reinitialiser` }); if (resetError) setError(resetError.message); else setMessage("Un lien de réinitialisation a été envoyé si cette adresse existe."); }
  return <main className="auth-shell"><section className="auth-panel auth-form-panel"><div className="login-card"><Link className="back-link" href="/connexion">← Retour à la connexion</Link><p className="section-kicker">Sécurité</p><h2>Mot de passe oublié.</h2><p className="form-lead">Saisissez votre email administrateur pour recevoir un lien sécurisé.</p><form onSubmit={submit}><input required type="email" placeholder="admin@ecole.fr" value={email} onChange={(event) => setEmail(event.target.value)} />{error && <p className="form-message form-error">{error}</p>}{message && <p className="form-message form-success">{message}</p>}<button className="submit-action" type="submit">Envoyer le lien <span>→</span></button></form></div></section></main>;
}
