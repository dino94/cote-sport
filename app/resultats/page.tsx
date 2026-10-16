"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Result {
  id: string;
  pick_id: string | null;
  match_name: string;
  cote: string;
  result: string;
  roi: string;
  date: string | null;
}

export default function ResultatsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      setLoading(true);
      const { data, error } = await supabase
        .from("results")
        .select("*")
        .order("date", { ascending: false });

      if (error) console.error("❌ results:", error);
      else setResults(data || []);
      setLoading(false);
    }
    fetchResults();
  }, []);

  const wins = results.filter((r) => r.result === "Gagné").length;
  const losses = results.filter((r) => r.result === "Perdu").length;
  const pending = results.filter((r) => r.result === "En attente").length;
  const done = wins + losses;
  const winRate = done > 0 ? ((wins / done) * 100).toFixed(1) : "0.0";
  const totalProfit = results
    .filter((r) => r.result !== "En attente" && r.result !== "Annulé")
    .reduce((sum, r) => sum + (Number(r.roi) || 0), 0);
  const roi = done > 0 ? ((totalProfit / done) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Résultats</h1>
        <p className="text-muted mt-1">
          Historique complet des paris, transparence totale.
        </p>
      </div>

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card border border-line/10 rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-muted">PARIS VALIDÉS</div>
              <div className="text-xl sm:text-2xl font-black text-ink">{done}</div>
              {pending > 0 && (
                <div className="text-xs text-amber-400 mt-0.5">
                  {pending} en attente
                </div>
              )}
            </div>
            <div className="bg-card border border-line/10 rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-muted">WIN RATE</div>
              <div className="text-xl sm:text-2xl font-black text-primary">
                {winRate}%
              </div>
            </div>
            <div className="bg-card border border-line/10 rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-muted">GAGNÉS / PERDUS</div>
              <div className="text-xl sm:text-2xl font-black text-ink">
                {wins} / {losses}
              </div>
            </div>
            <div className="bg-card border border-line/10 rounded-2xl p-4 sm:p-5">
              <div className="text-xs text-muted">ROI</div>
              <div
                className={`text-xl sm:text-2xl font-black ${
                  Number(roi) >= 0 ? "text-primary" : "text-red-400"
                }`}
              >
                {Number(roi) >= 0 ? "+" : ""}
                {roi}%
              </div>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="bg-card border border-line/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-line/10 text-muted text-xs uppercase">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Match</th>
                    <th className="text-left px-4 py-3">Cote</th>
                    <th className="text-left px-4 py-3">Résultat</th>
                    <th className="text-right px-4 py-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const isWin = r.result === "Gagné";
                    const isPending = r.result === "En attente";
                    const isCancelled = r.result === "Annulé";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-line/5 hover:bg-line/5 transition"
                      >
                        <td className="px-4 py-3 text-muted">
                          {r.date
                            ? new Date(r.date).toLocaleDateString("fr-FR")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-bold text-ink">
                          {r.match_name}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {Number(r.cote).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded-full ${
                              isWin
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : isPending
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : isCancelled
                                ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {isWin ? "🟢 " : isPending ? "⏳ " : isCancelled ? "⚪ " : "🔴 "}
                            {r.result}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            isPending
                              ? "text-muted"
                              : Number(r.roi) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {isPending
                            ? "—"
                            : `${Number(r.roi) >= 0 ? "+" : ""}${Number(r.roi).toFixed(2)}€`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">Aucun résultat enregistré pour le moment.</p>
          )}
        </>
      )}
    </div>
  );
}