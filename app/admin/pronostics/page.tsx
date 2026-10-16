"use client";

import { useEffect, useState } from "react";
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
}

const emptyForm = {
  match_name: "",
  league: "",
  bet_type: "",
  bet: "",
  cote: "",
  confidence: 3,
  category: "Aujourd'hui",
};

export default function AdminPronosticsPage() {
  const [items, setItems] = useState<Pick[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const payload = {
      match_name: form.match_name,
      league: form.league,
      bet_type: form.bet_type,
      bet: form.bet,
      cote: form.cote,
      confidence: Number(form.confidence),
      category: form.category,
    };

    if (editingId) {
      const { error } = await supabase.from("picks").update(payload).eq("id", editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("picks").insert(payload);
      if (error) { setError(error.message); return; }

      // Trigger notification edge function for new picks
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await fetch(`${supabaseUrl}/functions/v1/notify-subscribers`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              },
            });
          }
        }
      } catch {
        // Notifications are best-effort — don't block pick creation
      }
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchItems();
  }

  function handleEdit(item: Pick) {
    setForm({
      match_name: item.match_name,
      league: item.league,
      bet_type: item.bet_type,
      bet: item.bet,
      cote: item.cote,
      confidence: item.confidence,
      category: item.category,
    });
    setEditingId(item.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce pronostic ?")) return;
    const { error } = await supabase.from("picks").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    fetchItems();
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-ink">{editingId ? "Modifier le pronostic" : "Ajouter un pronostic"}</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-line/10 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase">Match</label>
            <input required value={form.match_name} onChange={(e) => setForm({ ...form, match_name: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="PSG - OM" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">Ligue / Horaire</label>
            <input required value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="Ligue 1 • 21:00" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">Type de pari</label>
            <input required value={form.bet_type} onChange={(e) => setForm({ ...form, bet_type: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="Over/Under" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">Cote</label>
            <input required value={form.cote} onChange={(e) => setForm({ ...form, cote: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="2.10" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">Confiance (1-5)</label>
            <select value={form.confidence} onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition">
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}/5</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">Catégorie</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition">
              <option value="Aujourd&apos;hui">Aujourd&apos;hui</option>
              <option value="Week-end">Week-end</option>
              <option value="À venir">À venir</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted uppercase">Description du pari</label>
          <input required value={form.bet} onChange={(e) => setForm({ ...form, bet: e.target.value })}
            className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
            placeholder="Under 2.5 buts" />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="bg-primary text-black font-black rounded-xl px-6 py-2.5 hover:opacity-90 transition">
            {editingId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancel} className="text-muted hover:text-ink transition font-bold rounded-xl px-6 py-2.5 border border-line/10">
              Annuler
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-black text-ink">Pronostics existants ({items.length})</h2>

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">Aucun pronostic.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-card border border-line/10 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted mb-1">
                  <span className="text-primary font-bold">{item.category}</span>
                  <span>·</span>
                  <span>{item.bet_type}</span>
                  <span>·</span>
                  <span>Cote {item.cote}</span>
                  <span>·</span>
                  <span>Confiance {item.confidence}/5</span>
                </div>
                <div className="font-bold text-ink">{item.match_name}</div>
                <div className="text-sm text-muted">{item.bet}</div>
                <div className="text-xs text-muted mt-0.5">{item.league}</div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => handleEdit(item)} className="text-xs font-bold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition">
                  Modifier
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-xs font-bold text-red-400 border border-red-400/30 rounded-lg px-3 py-1.5 hover:bg-red-500/10 transition">
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
