import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Récupère les picks créés il y a plus de 24h
  const { data: expired, error: fetchErr } = await supabase
    .from("picks")
    .select("*")
    .lt("created_at", cutoff);

  if (fetchErr) {
    console.error("❌ fetch picks:", fetchErr);
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({ archived: 0, message: "Rien à archiver" });
  }

  // 2. Insère dans results (en copiant match_name et cote)
  const { error: insertErr } = await supabase.from("results").insert(
    expired.map((p) => ({
      pick_id: p.id,
      match_name: p.match_name,
      cote: p.cote,
      result: "En attente",     // ← SANS "s"
      roi: "0",
      date: p.created_at,
    }))
  );

  if (insertErr) {
    console.error("❌ insert results:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // 3. Supprime les picks archivés
  const { error: delErr } = await supabase
    .from("picks")
    .delete()
    .in("id", expired.map((p) => p.id));

  if (delErr) {
    console.error("❌ delete picks:", delErr);
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  console.log(`✅ Archivé ${expired.length} pick(s)`);
  return NextResponse.json({ archived: expired.length, picks: expired.map(p => p.match_name) });
}