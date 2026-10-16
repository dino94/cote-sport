"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Analysis {
  id: string;
  match_name: string;
  league: string;
  analyses: string;
  date: string | null;
}

const emptyForm = {
  match_name: "",
  league: "",
  analyses: "",
  date: "",
};

export default function AdminAnalysesPage() {
  const [items, setItems] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("analyses")
      .select("*")
      .order("date", { ascending: false });
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
      analyses: form.analyses,
      date: form.date || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("analyses")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("analyses").insert(payload);
      if (error) {
        setError(error.message);
        return;
      }
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchItems();
  }

  function handleEdit(item: Analysis) {
    setForm({
      match_name: item.match_name,
      league: item.league || "",
      analyses: item.analyses || "",
      date: item.date || "",
    });
    setEditingId(item.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette analyse ?")) return;
    const { error } = await supabase.from("analyses").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    fetchItems();
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-ink">
        {editingId ? "Modifier l'analyse" : "Ajouter une analyse"}
      </h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-card border border-line/10 rounded-2xl p-6 space-y-4"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase">
              Match
            </label>
            <input
              required
              value={form.match_name}
              onChange={(e) =>
                setForm({ ...form, match_name: e.target.value })
              }
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="PSG - Marseille"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted uppercase">
              Compétition
            </label>
            <input
              required
              value={form.league}
              onChange={(e) => setForm({ ...form, league: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              placeholder="Ligue 1"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-muted uppercase">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted uppercase">
            Analyse
          </label>
          <textarea
            required
            value={form.analyses}
            onChange={(e) => setForm({ ...form, analyses: e.target.value })}
            className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition min-h-[120px]"
            placeholder="Modèle xG : PSG 2.1 vs OM 1.3. Valeur sur le Over 2.5 à 1.85."
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-primary text-black font-black rounded-xl px-6 py-2.5 hover:opacity-90 transition"
          >
            {editingId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-muted hover:text-ink transition font-bold rounded-xl px-6 py-2.5 border border-line/10"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-black text-ink">
        Analyses existantes ({items.length})
      </h2>

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : items.length === 0 ? (
        <p className="text-muted">Aucune analyse.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-card border border-line/10 rounded-2xl p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted mb-1 flex-wrap">
                  <span>{item.league}</span>
                  {item.date && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(item.date).toLocaleDateString("fr-FR")}
                      </span>
                    </>
                  )}
                </div>
                <div className="font-bold truncate text-ink">
                  {item.match_name}
                </div>
                <div className="text-sm text-muted line-clamp-2">
                  {item.analyses}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleEdit(item)}
                  className="text-xs font-bold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/10 transition"
                >
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
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