"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type ParentRequest = {
  account_role: "student" | "parent";
  account_id: string;
  account_name: string;
  account_email: string | null;
  student_id: string;
  student_name: string;
  student_number: string;
  relationship: string;
};

export default function ParentAssignmentsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<ParentRequest[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  async function loadRequests() {
    const { data, error: requestError } = await supabase.rpc("list_pending_parent_links");
    if (requestError) throw new Error(requestError.message);
    setRequests((data ?? []) as ParentRequest[]);
  }

  useEffect(() => {
    async function start() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/connexion"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "school_admin") { router.replace("/espace"); return; }
      await loadRequests();
    }
    start().catch((reason) => setError(reason instanceof Error ? reason.message : "Chargement impossible.")).finally(() => setLoading(false));
  }, [router]);

  async function review(request: ParentRequest, approve: boolean) {
    setBusyId(`${request.account_id}:${request.student_id}`);
    setError("");
    setMessage("");
    const { error: reviewError } = await supabase.rpc("review_parent_link", {
      p_role: request.account_role,
      p_account_id: request.account_id,
      p_student_id: request.student_id,
      p_approve: approve,
    });
    if (reviewError) {
      setError(reviewError.message);
    } else {
      setMessage(approve ? "Rattachement approuvé." : "Demande refusée.");
      try { await loadRequests(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Actualisation impossible."); }
    }
    setBusyId("");
  }

  return <main className="private-shell"><header className="private-topbar"><Link className="brand" href="/espace"><span className="brand-mark">N</span><span>Noria</span></Link><Link className="sign-out" href="/espace">Retour à l’administration</Link></header><section className="private-content"><div className="admin-toolbar"><Link className="toolbar-button" href="/espace/eleves">Dossiers élèves <span>↗</span></Link></div><p className="section-kicker">Administration · Élèves et familles</p><h1>Rattachements élèves et parents.</h1><p className="private-lead">Vérifiez les demandes avec le parent avant d’ouvrir l’accès aux résultats.</p>{error && <p className="form-message form-error" role="alert">{error}</p>}{message && <p className="form-message form-success" role="status">{message}</p>}{loading ? <p className="muted-copy">Chargement des demandes…</p> : requests.length === 0 ? <div className="empty-space-card"><span className="card-index">Aucune demande en attente</span><h2>Les familles sont à jour.</h2><p>Les prochaines demandes d’association parent/élève apparaîtront ici.</p></div> : <div className="student-list parent-request-list">{requests.map((request) => { const id = `${request.account_id}:${request.student_id}`; return <article key={id}><div><strong>{request.account_name}</strong><small>{request.account_role === "parent" ? "Parent" : "Élève"} · {request.account_email ?? "Email indisponible"} · {request.relationship}</small></div><div><strong>{request.student_name}</strong><small>Identifiant : {request.student_number}</small></div><div className="parent-request-actions"><button className="submit-action" type="button" disabled={busyId === id} onClick={() => void review(request, true)}>Approuver <span>✓</span></button><button className="archive-button" type="button" disabled={busyId === id} onClick={() => void review(request, false)}>Refuser</button></div></article>; })}</div>}</section></main>;
}