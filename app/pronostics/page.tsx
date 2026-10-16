"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import PickCard from "@/Components/PickCard";

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

export default function PronosticsPage() {
  const { session, loading: authLoading } = useAuth();
  const [picks, setPicks] = useState<Pick[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Wait until auth state is resolved before fetching
    if (authLoading) return;

    async function fetchPicks() {
      setDataLoading(true);
      let query = supabase
        .from("picks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!session) {
        query = query.limit(1);
      }

      const { data, error } = await query;
      if (error) {
        setError(true);
      } else {
        setPicks(data || []);
      }
      setDataLoading(false);
    }
    fetchPicks();
  }, [session, authLoading]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-ink">Pronostics</h1>
          <p className="text-muted mt-1">Sélection de paris value du jour et du week-end.</p>
        </div>
        <p className="text-muted">Chargement...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-black text-ink">Pronostics</h1>
          <p className="text-muted mt-1">Sélection de paris value du jour et du week-end.</p>
        </div>
        <p className="text-muted">Impossible de charger les pronostics pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink">Pronostics</h1>
        <p className="text-muted mt-1">Sélection de paris value du jour et du week-end.</p>
      </div>

      {dataLoading ? (
        <p className="text-muted">Chargement...</p>
      ) : picks.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {picks.map((p) => (
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
            ))}
          </div>
          {!session && (
            <div className="bg-card border border-line/10 rounded-3xl p-8 text-center max-w-lg mx-auto mt-6">
              <h2 className="text-xl font-black mb-2 text-ink">Accédez à tous les pronostics</h2>
              <p className="text-muted text-sm mb-6">
                Inscrivez-vous gratuitement pour voir l&apos;intégralité de nos pronostics value.
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
        <p className="text-muted">Aucun pronostic disponible pour le moment.</p>
      )}
    </div>
  );
}
