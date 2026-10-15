"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const { error: updateError } = await supabase.auth.updateUser({ password }); if (updateError) setError(updateError.message); else router.push("/connexion"); }
  return <main className="auth-shell"><section className="auth-panel auth-form-panel"><div className="login-card"><p className="section-kicker">Sécurité</p><h2>Nouveau mot de passe.</h2><form onSubmit={submit}><input required minLength={8} type="password" placeholder="Nouveau mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} />{error && <p className="form-message form-error">{error}</p>}<button className="submit-action" type="submit">Enregistrer <span>→</span></button></form></div></section></main>;
}
