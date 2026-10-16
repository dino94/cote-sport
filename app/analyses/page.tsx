"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import AnalysisCard from "@/Components/AnalysisCard";

interface Analysis {
  id: string;
  sport: string;
  competition: string;
  date: string | null;
  title: string;
  resume: string | null;
  icon: string | null;
}

export default function AnalysesPage() {
  const { session, loading: authLoading } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalyses() {
      setLoading(true);
      const { data } = await supabase
        .from("analyses")
        .select("*")
        .order("date", { ascending: false });
      setAnalyses(data || []);
      setLoading(false);
    }
    fetchAnalyses();
  }, [session]);

  const isSubscriber = !!session;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Analyses</h1>
        <p className="text-muted mt-1">Analyses statistiques détaillées des matchs à venir.</p>
      </div>

      {loading || authLoading ? (
        <p className="text-muted">Chargement...</p>
      ) : analyses.length > 0 ? (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((a) => (
              <AnalysisCard
                key={a.id}
                sport={a.sport}
                compet={a.competition}
                date={a.date || ""}
                title={a.title}
                resume={a.resume || ""}
                icon={a.icon || ""}
              />
            ))}
          </div>
          {!isSubscriber && (
            <div className="bg-card border border-line/10 rounded-3xl p-8 text-center max-w-lg mx-auto mt-6">
              <h2 className="text-xl font-black mb-2 text-ink">Accédez à toutes les analyses</h2>
              <p className="text-muted text-sm mb-6">
                Inscrivez-vous gratuitement pour voir l&apos;intégralité de nos analyses statistiques.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/login" className="bg-primary text-black font-black rounded-full px-6 py-3 hover:opacity-90 transition">
                  Se connecter
                </Link>
                <Link href="/signup" className="border border-line/20 text-ink font-bold rounded-full px-6 py-3 hover:border-primary transition">
                  S&apos;inscrire gratuitement
                </Link>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-muted">Aucune analyse disponible pour le moment.</p>
      )}
    </div>
  );
}
