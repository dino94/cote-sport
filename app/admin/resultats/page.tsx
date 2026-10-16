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
  created_at?: string;
}

const emptyForm = {
  match_name: "",
  cote: "",
  result: "En attente",
  roi: "0",
  date: "",
};

export default function AdminResultatsPage() {
  const [items, setItems] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickProfit, setQuickProfit] = useState("");

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from("results")
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
      cote: form.cote,
      result: form.result,
      roi: form.roi,
      date: form.date || null,
    };

    if (editingId) {
      const { error } = await supabase.from("results").update(payload).eq("id", editingId);
      if (error) { setError(error.message); return; }
    } else {
      const { error } = await supabase.from("results").insert(payload);
      if (error) { setError(error.message); return; }
    }

    setForm(emptyForm);
    setEditingId(null);
    fetchItems();
  }

  function handleEdit(item: Result) {
    setForm({
      match_name: item.match_name,
      cote: String(item.cote),
      result: item.result,
      roi: String(item.roi),
      date: item.date || "",
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce résultat ?")) return;
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    fetchItems();
  }

  function handleCancel() {
    setForm(emptyForm);
    setEditingId(null);
  }

  // ✅ Validation rapide : passe "En attente" → "Gagné" ou "Perdu"
  function startQuickValidate(item: Result, outcome: "Gagné" | "Perdu") {
    const coteNum = Number(item.cote) || 1;
    const suggested = outcome === "Gagné" ? ((coteNum - 1) * 10).toFixed(2) : "-10";
    setQuickEditId(item.id);
    setQuickProfit(suggested);
  }

  async function confirmQuickValidate(id: string, outcome: "Gagné" | "Perdu") {
    const { error } = await supabase
      .from("results")
      .update({ result: outcome, roi: quickProfit })
      .eq("id", id);
    if (error) { setError(error.message); return; }
    setQuickEditId(null);
    setQuickProfit("");
    fetchItems();
  }

  const pending = items.filter((i) => i.result === "En attente");
  const done = items.filter((i) => i.result !== "En attente");

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* SECTION VALIDATION RAPIDE */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-xl font-black text-ink mb-3">
            ⏳ À valider ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((item) => (
              <div key={item.id} className="bg-card border border-amber-500/20 rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-bold text-ink">{item.match_name}</div>
                    <div className="text-xs text-muted">
                      Cote {item.cote}
                      {item.date && ` · ${new Date(item.date).toLocaleDateString("fr-FR")}`}
                    </div>
                  </div>

                  {quickEditId === item.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={quickProfit}
                        onChange={(e) => setQuickProfit(e.target.value)}
                        className="w-24 bg-bg border border-line/20 rounded-lg px-3 py-1.5 text-sm text-ink"
                        placeholder="Profit €"
                        autoFocus
                      />
                      <button
                        onClick={() => confirmQuickValidate(item.id, "Gagné")}
                        className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-green-500/30 transition"
                      >
                        ✅ Confirmer
                      </button>
                      <button
                        onClick={() => confirmQuickValidate(item.id, "Perdu")}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-red-500/30 transition"
                      >
                        ❌ Confirmer
                      </button>
                      <button
                        onClick={() => setQuickEditId(null)}
                        className="text-muted hover:text-ink text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startQuickValidate(item, "Gagné")}
                        className="bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-green-500/30 transition"
                      >
                        ✅ Gagné
                      </button>
                      <button
                        onClick={() => startQuickValidate(item, "Perdu")}
                        className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-red-500/30 transition"
                      >
                        ❌ Perdu
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMULAIRE AJOUT/MODIF */}
      <div>
        <h2 className="text-xl font-black text-ink mb-3">
          {editingId ? "Modifier le résultat" : "Ajouter un résultat manuellement"}
        </h2>

        <form onSubmit={handleSubmit} className="bg-card border border-line/10 rounded-2xl p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-muted uppercase">Match</label>
              <input
                required
                value={form.match_name}
                onChange={(e) => setForm({ ...form, match_name: e.target.value })}
                className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
                placeholder="PSG - OM"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase">Cote</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.cote}
                onChange={(e) => setForm({ ...form, cote: e.target.value })}
                className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
                placeholder="2.10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase">Résultat</label>
              <select
                value={form.result}
                onChange={(e) => setForm({ ...form, result: e.target.value })}
                className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              >
                <option value="En attente">En attente</option>
                <option value="Gagné">Gagné</option>
                <option value="Perdu">Perdu</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase">Profit (roi)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.roi}
                onChange={(e) => setForm({ ...form, roi: e.target.value })}
                className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
                placeholder="1.10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full mt-1 bg-bg border border-line/10 rounded-xl px-4 py-2.5 text-ink focus:border-primary focus:outline-none transition"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-primary text-black font-black rounded-xl px-6 py-2.5 hover:opacity-90 transition">
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
      </div>

      {/* RÉSULTATS TERMINÉS */}
      <div>
        <h2 className="text-xl font-black text-ink mb-3">
          ✅ Historique ({done.length})
        </h2>

        {loading ? (
          <p className="text-muted">Chargement...</p>
        ) : done.length === 0 ? (
          <p className="text-muted">Aucun résultat archivé.</p>
        ) : (
          <div className="space-y-3">
            {done.map((item) => {
              const isWin = item.result === "Gagné";
              const isCancelled = item.result === "Annulé";
              return (
                <div
                  key={item.id}
                  className="bg-card border border-line/10 rounded-2xl p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted mb-1 flex-wrap">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full ${
                          isWin
                            ? "text-green-400 bg-green-500/10"
                            : isCancelled
                            ? "text-zinc-400 bg-zinc-500/10"
                            : "text-red-400 bg-red-500/10"
                        }`}
                      >
                        {item.result}
                      </span>
                      <span>·</span>
                      <span>Cote {item.cote}</span>
                      <span>·</span>
                      <span className={Number(item.roi) >= 0 ? "text-green-400" : "text-red-400"}>
                        {Number(item.roi) >= 0 ? "+" : ""}
                        {item.roi}€
                      </span>
                      {item.date && (
                        <>
                          <span>·</span>
                          <span>{new Date(item.date).toLocaleDateString("fr-FR")}</span>
                        </>
                      )}
                    </div>
                    <div className="font-bold text-ink truncate">{item.match_name}</div>
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}