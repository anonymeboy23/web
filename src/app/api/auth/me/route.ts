import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) return NextResponse.json({ error: "Session ou configuration serveur invalide." }, { status: 401 });
  const publicClient = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await publicClient.auth.getUser(token); if (userError || !userData.user) return NextResponse.json({ error: "Session invalide." }, { status: 401 });
  const { data: profileData, error: profileError } = await publicClient.rpc("current_profile");
  const profile = Array.isArray(profileData) ? profileData[0] : profileData;
  if (profileError || !profile) return NextResponse.json({ error: "Profil scolaire introuvable ou désactivé." }, { status: 403 });
  return NextResponse.json({ user: userData.user, profile });
}
