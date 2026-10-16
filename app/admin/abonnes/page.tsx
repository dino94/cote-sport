"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Subscriber {
  id: string;
  email: string;
  user_id: string | null;
  notify_picks: boolean;
  created_at: string;
}

export default function AdminAbonnesPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchSubscribers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("subscribers")
      .select("id, email, user_id, notify_picks, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setSubscribers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function toggleNotify(sub: Subscriber) {
    const { error } = await supabase
      .from("subscribers")
      .update({ notify_picks: !sub.notify_picks })
      .eq("id", sub.id);
    if (error) {
      setError(error.message);
      return;
    }
    setSubscribers((prev) =>
      prev.map((s) => (s.id === sub.id ? { ...s, notify_picks: !s.notify_picks } : s))
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet abonné ?")) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    fetchSubscribers();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-ink">Abonnés ({subscribers.length})</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : subscribers.length === 0 ? (
        <p className="text-muted">Aucun abonné pour le moment.</p>
      ) : (
        <div className="space-y-3">
          {subscribers.map((sub) => (
            <div key={sub.id} className="bg-card border border-line/10 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink truncate">{sub.email}</div>
                <div className="text-xs text-muted mt-0.5">
                  Inscrit le {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => toggleNotify(sub)}
                  className={`text-xs font-bold rounded-lg px-3 py-1.5 border transition ${
                    sub.notify_picks
                      ? "text-primary border-primary/30 bg-primary/10"
                      : "text-muted border-line/10"
                  }`}
                >
                  {sub.notify_picks ? "Notifications ON" : "Notifications OFF"}
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="text-xs font-bold text-red-400 border border-red-400/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
