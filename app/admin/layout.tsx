"use client";

import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { session, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [isLoginPage, setIsLoginPage] = useState(false);

  useEffect(() => {
    const checkLogin = () => setIsLoginPage(window.location.pathname === "/admin/login");
    checkLogin();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!session && !isLoginPage) {
        router.push("/admin/login");
      } else if (session && !isAdmin && isLoginPage) {
        router.push("/");
      } else if (session && !isAdmin && !isLoginPage) {
        router.push("/");
      }
    }
  }, [loading, session, isAdmin, isLoginPage, router]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-muted">
        Chargement...
      </div>
    );
  }

  if (!session && !isLoginPage) {
    return null;
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (session && !isAdmin) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-black text-ink mb-2">Accès refusé</h1>
          <p className="text-muted text-sm mb-6">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
          </p>
          <Link href="/" className="bg-primary text-black font-black rounded-full px-6 py-3 hover:opacity-90 transition inline-block">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line/10">
        <h1 className="text-2xl font-black text-ink">Panneau d&apos;administration</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-muted hover:text-ink transition">
            ← Voir le site
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 transition font-bold"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin" className="px-4 py-2 rounded-full text-sm font-bold bg-card border border-line/10 hover:border-primary transition text-ink">
          🏠 Dashboard
        </Link>
        <Link href="/admin/analyses" className="px-4 py-2 rounded-full text-sm font-bold bg-card border border-line/10 hover:border-primary transition text-ink">
          Analyses
        </Link>
        <Link href="/admin/pronostics" className="px-4 py-2 rounded-full text-sm font-bold bg-card border border-line/10 hover:border-primary transition text-ink">
          Pronostics
        </Link>
        <Link href="/admin/resultats" className="px-4 py-2 rounded-full text-sm font-bold bg-card border border-line/10 hover:border-primary transition text-ink">
          Résultats
        </Link>
        <Link href="/admin/abonnes" className="px-4 py-2 rounded-full text-sm font-bold bg-card border border-line/10 hover:border-primary transition text-ink">
          Abonnés
        </Link>
      </div>

      {children}
    </div>
  );
}