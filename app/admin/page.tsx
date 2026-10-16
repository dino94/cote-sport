"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Pick {
  id: string;
  match_name: string;
  league: string;
  bet_type: string;
  bet: string;
  cote: string;
  confidence: number;
  category: string;
  created_at: string;
}

interface PendingResult {
  id: string;
  match_name: string;
  cote: string;
  result: string;
  date: string | null;
}

export default function AdminDashboardPage() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [pendingResults, setPendingResults] = useState<PendingResult[]>([]);
  const [stats, setStats] = useState({
    picks: 0,
    pending: 0,
    analyses: 0,
    results: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [picksRes, pendingRes, analysesRes, resultsRes] = await Promise.all([
        supabase
          .from("picks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("results")
          .select("*")
          .eq("result", "En attente")
          .order("date", { ascending: false })
          .limit(5),
        supabase.from("analyses").select("*", { count: "exact", head: true }),
        supabase.from("results").select("*", { count: "exact", head: true }),
      ]);

      if (picksRes.error) console.error("picks:", picksRes.error);
      if (pendingRes.error) console.error("pending:", pendingRes.error);
      if (analysesRes.error) console.error("analyses:", analysesRes.error);
      if (resultsRes.error) console.error("results:", resultsRes.error);

      setPicks(picksRes.data || []);
      setPendingResults(pendingRes.data || []);
      setStats({
        picks: picksRes.data?.length || 0,
        pending: pendingRes.data?.length || 0,
        analyses: analysesRes.count || 0,
        results: resultsRes.count || 0,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return <p className="text-muted">Chargement...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-ink">Tableau de bord</h2>
        <p className="text-muted mt-1 text-sm">
          Vue d&apos;ensemble de ton activité.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-line/10 rounded-2xl p-4">
          <div className="text-xs text-muted uppercase">Picks actifs</div>
          <div className="text-3xl font-black text-ink mt-1">{stats.picks}</div>
        </div>
        <div className="bg-card border border-line/10 rounded-2xl p-4">
          <div className="text-xs text-muted uppercase">À valider</div>
          <div className="text-3xl font-black text-amber-400 mt-1">
            {stats.pending}
          </div>
        </div>
        <div className="bg-card border border-line/10 rounded-2xl p-4">
          <div className="text-xs text-muted uppercase">Analyses</div>
          <div className="text-3xl font-black text-ink mt-1">
            {stats.analyses}
          </div>
        </div>
        <div className="bg-card border border-line/10 rounded-2xl p-4">
          <div className="text-xs text-muted uppercase">Résultats</div>
          <div className="text-3xl font-black text-primary mt-1">
            {stats.results}
          </div>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div>
        <h3 className="text-lg font-black text-ink mb-3">⚡ Actions rapides</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/pronostics"
            className="bg-primary text-black font-black rounded-xl px-5 py-2.5 hover:opacity-90 transition text-sm"
          >
            + Nouveau pick
          </Link>
          <Link
            href="/admin/analyses"
            className="bg-card border border-line/10 text-ink font-bold rounded-xl px-5 py-2.5 hover:border-primary transition text-sm"
          >
            + Nouvelle analyse
          </Link>
          <Link
            href="/admin/resultats"
            className="bg-card border border-line/10 text-ink font-bold rounded-xl px-5 py-2.5 hover:border-primary transition text-sm"
          >
            Valider les résultats
          </Link>
        </div>
      </div>

      {/* À VALIDER */}
      {pendingResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-black text-ink">
              ⏳ À valider ({pendingResults.length})
            </h3>
            <Link
              href="/admin/resultats"
              className="text-primary font-bold text-sm hover:opacity-80"
            >
              Tout voir →
            </Link>
          </div>
          <div className="space-y-2">
            {pendingResults.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="bg-card border border-amber-500/20 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink truncate">
                    {r.match_name}
                  </div>
                  <div className="text-xs text-muted">
                    Cote {r.cote}
                    {r.date &&
                      ` · ${new Date(r.date).toLocaleDateString("fr-FR")}`}
                  </div>
                </div>
                <Link
                  href="/admin/resultats"
                  className="text-xs font-bold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition shrink-0"
                >
                  Valider →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DERNIERS PICKS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-ink">🎯 Derniers picks</h3>
          <Link
            href="/admin/pronostics"
            className="text-primary font-bold text-sm hover:opacity-80"
          >
            Tout voir →
          </Link>
        </div>
        {picks.length === 0 ? (
          <p className="text-muted text-sm">Aucun pick pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {picks.map((p) => (
              <div
                key={p.id}
                className="bg-card border border-line/10 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 text-xs text-muted mb-1 flex-wrap">
                  <span className="text-primary font-bold">{p.category}</span>
                  <span>·</span>
                  <span>{p.bet_type}</span>
                  <span>·</span>
                  <span>Cote {p.cote}</span>
                  <span>·</span>
                  <span>Confiance {p.confidence}/5</span>
                </div>
                <div className="font-bold text-ink">{p.match_name}</div>
                <div className="text-sm text-muted">{p.bet}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}