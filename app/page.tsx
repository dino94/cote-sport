"use client";

import { useEffect, useState } from "react";
import AnalysisCard from "@/Components/AnalysisCard";
import PickCard from "@/Components/PickCard";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface Analysis {
  id: string;
  match_name: string;
  league: string | null;
  analyses: string | null;
  date: string | null;
}

interface Pick {
  id: string;
  match_name: string;
  league: string;
  bet_type: string;
  bet: string;
  cote: string;
  confidence: number;
  category: string;
}

interface Result {
  id: string;
  match_name: string;
  cote: string;
  result: string;      // ✅ singulier
  roi: string;         // ✅ pas "profit"
  date: string | null;
}

export default function Home() {
  const { session } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [aRes, pRes, rRes] = await Promise.all([
        supabase.from("analyses").select("*").order("date", { ascending: false }).limit(3),
        supabase
          .from("picks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(session ? 4 : 1),
        supabase.from("results").select("*").order("date", { ascending: false }).limit(5),
      ]);

      if (aRes.error) console.error("❌ analyses:", aRes.error);
      if (pRes.error) console.error("❌ picks:", pRes.error);
      if (rRes.error) console.error("❌ results:", rRes.error);

      setAnalyses(aRes.data || []);
      setPicks(pRes.data || []);
      setResults(rRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, [session]);

  const wins = results.filter((r) => r.result === "Gagné").length;
  const total = results.length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
  const avgCote =
    total > 0
      ? (results.reduce((sum, r) => sum + (Number(r.cote) || 0), 0) / total).toFixed(2)
      : "0.00";
  const roi =
    total > 0
      ? ((results.reduce((sum, r) => sum + (Number(r.roi) || 0), 0) / total) * 100).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-muted">
        Chargement...
      </div>
    );
  }

  return (
    <>
      <section className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-card border border-line/10 rounded-[24px] sm:rounded-[32px] p-5 sm:p-7 lg:p-10 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary/10 blur-[80px] rounded-full" />

          <span className="inline-flex text-xs font-black tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            ● CONSEIL INDÉPENDANT DEPUIS 2022
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-black leading-[0.9] tracking-tighter mt-5 text-ink">
            La data<br />
            <span className="text-primary">bat l&apos;intuition.</span>
          </h1>

          <p className="text-muted mt-4 leading-relaxed">
            Service de conseil en paris sportifs. Analyses statistiques football, NBA, tennis.
            Zéro pari plaisir, 100% value bet et gestion stricte de la bankroll.
          </p>

          <div className="flex flex-wrap gap-3 mt-7">
            <Link
              href="/analyses"
              className="bg-primary text-black px-5 sm:px-7 py-3 sm:py-3.5 rounded-full font-black hover:opacity-90 transition text-sm sm:text-base"
            >
              Voir les analyses →
            </Link>
            <Link
              href="/pronostics"
              className="bg-ink text-bg px-5 sm:px-7 py-3 sm:py-3.5 rounded-full font-black hover:opacity-90 transition text-sm sm:text-base"
            >
              Découvrir les pronostics
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-line/10">
            <div>
              <div className="text-xl sm:text-2xl font-black text-ink">+{roi}%</div>
              <div className="text-[11px] font-bold text-muted">ROI GLOBAL</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-ink">{winRate}%</div>
              <div className="text-[11px] font-bold text-muted">WIN RATE</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-ink">{avgCote}</div>
              <div className="text-[11px] font-bold text-muted">COTE MOY.</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-surface border border-line/10 rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 flex flex-col">
          <div className="flex justify-between items-center text-xs font-mono mb-4">
            <span className="text-primary">● DERNIERS RÉSULTATS</span>
            <Link href="/resultats" className="text-primary hover:opacity-80 font-bold">
              Tout voir →
            </Link>
          </div>

          {results.length > 0 ? (
            <div className="space-y-2 flex-1">
              {results.slice(0, 5).map((r) => {
                const isWin = r.result === "Gagné";
                const isPending = r.result === "En attente";
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-card border border-line/10 rounded-xl px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-lg shrink-0">
                        {isWin ? "🟢" : isPending ? "⏳" : "🔴"}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-ink truncate">
                          {r.match_name}
                        </div>
                        <div className="text-xs text-muted">
                          {r.date ? new Date(r.date).toLocaleDateString("fr-FR") : "—"}
                          {!isPending && ` · ${r.result}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="text-sm font-black text-ink">{r.cote}</div>
                      {!isPending && (
                        <div
                          className={`text-xs font-bold ${
                            isWin ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {Number(r.roi) > 0 ? "+" : ""}
                          {r.roi}€
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted text-sm py-8">
              Aucun résultat pour le moment
            </div>
          )}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-6">
        <div className="bg-card border border-line/10 rounded-3xl p-6">
          <h3 className="font-extrabold text-ink">Analyse Statistique</h3>
          <p className="text-sm text-muted mt-1">
            Modèle xG, efficience marché. On ne parie que si edge &gt; 3%.
          </p>
        </div>

        <div className="bg-card border border-line/10 rounded-3xl p-6">
          <h3 className="font-extrabold text-ink">Gestion Bankroll</h3>
          <p className="text-sm text-muted mt-1">Mises fixes 1-3 unités. Jamais de martingale.</p>
        </div>

        <div className="bg-card border border-line/10 rounded-3xl p-6">
          <h3 className="font-extrabold text-ink">Stratégie Long Terme</h3>
          <p className="text-sm text-muted mt-1">{total} paris archivés, transparence totale.</p>
        </div>
      </div>

      <div className="flex justify-between items-end mt-8 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-black text-ink">Analyses du jour</h2>
        <Link href="/analyses" className="text-primary font-bold text-sm">
          Tout voir →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
        {analyses.length > 0 ? (
          analyses.map((a) => (
            <AnalysisCard
              key={a.id}
              sport="Football"
              compet={a.league || "—"}
              date={a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}
              title={a.match_name}
              resume={a.analyses || ""}
              icon="⚽"
            />
          ))
        ) : (
          <p className="text-muted">Aucune analyse disponible.</p>
        )}
      </div>

      <div className="flex justify-between items-end mt-8 sm:mt-10">
        <h2 className="text-xl sm:text-2xl font-black text-ink">Pronostic du jour</h2>
        <Link href="/pronostics" className="text-primary font-bold text-sm">
          Voir tout →
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
        {picks.length > 0 ? (
          picks.map((p) => (
            <PickCard
              key={p.id}
              match={p.match_name}
              league={p.league}
              type={p.bet_type}
              bet={p.bet}
              cote={p.cote}
              conf={p.confidence}
              cat={p.category}
            />
          ))
        ) : (
          <p className="text-muted">Aucun pronostic disponible.</p>
        )}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 sm:p-4 mt-6 sm:mt-8 text-xs sm:text-sm text-amber-700 dark:text-amber-200">
        <b>⚠️ Jeu Responsable -18 ans :</b> Les paris comportent des risques. Aucun gain garanti.
        Joueurs-info-service.fr - 09 74 75 13 13
      </div>
    </>
  );
}