"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/Components/NotificationBell";
import PWAInstallButton from "@/Components/PWAInstallButton";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { session, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: string) =>
    !!pathname && (pathname === href || pathname.startsWith(`${href}/`));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="border-b border-line/10 bg-surface/90 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2">

        {/* LOGO */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Image
            src="/logo.svg"
            alt="Coteflex Logo"
            width={40}
            height={40}
            priority
            className="rounded-lg w-8 h-8 sm:w-10 sm:h-10"
          />
          <span className="hidden sm:inline font-black text-lg text-ink">COTEFLEX</span>
        </Link>

        {/* DESKTOP NAV */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted">
          <Link href="/analyses" aria-current={isActive("/analyses") ? "page" : undefined} className="nav-link px-3 py-2 hover:text-ink">Analyses</Link>
          <Link href="/pronostics" aria-current={isActive("/pronostics") ? "page" : undefined} className="nav-link px-3 py-2 hover:text-ink">Pronostics</Link>
          <Link href="/resultats" aria-current={isActive("/resultats") ? "page" : undefined} className="nav-link px-3 py-2 hover:text-ink">Résultats</Link>
          <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined} className="nav-link px-3 py-2 hover:text-ink">Contact</Link>
          {isAdmin && <Link href="/admin" aria-current={isActive("/admin") ? "page" : undefined} className="nav-link px-3 py-2 text-primary font-bold hover:opacity-80">Admin</Link>}
        </div>

        {/* DESKTOP RIGHT */}
        <div className="hidden md:flex items-center gap-2">
          <PWAInstallButton />
          {session && <NotificationBell />}
          <button
            onClick={toggleTheme}
            className="text-muted hover:text-ink transition w-9 h-9 flex items-center justify-center rounded-full border border-line/10 hover:border-primary/30 transition"
            aria-label="Changer de thème"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>

          {session ? (
            <>
              <span className="text-sm text-muted max-w-[140px] truncate">{session.user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm font-bold text-red-400 hover:text-red-300 transition"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted hover:text-ink transition font-bold">
                Connexion
              </Link>
              <Link href="/signup" className="btn-premium text-sm bg-primary text-black font-black rounded-full px-5 py-2 hover:opacity-90 transition whitespace-nowrap">
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* MOBILE RIGHT BUTTONS */}
        <div className="flex md:hidden items-center gap-2">
          <PWAInstallButton />   {/* ← AJOUTÉ ICI */}
          <button
            onClick={toggleTheme}
            className="text-muted hover:text-ink transition w-9 h-9 flex items-center justify-center rounded-full border border-line/10"
            aria-label="Changer de thème"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            className="text-muted hover:text-ink transition text-xl w-9 h-9 flex items-center justify-center"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {open && (
        <div className="md:hidden bg-card border-t border-line/10 px-4 py-4 space-y-3 text-muted">
          <Link href="/analyses" aria-current={isActive("/analyses") ? "page" : undefined} className="nav-link block px-3 py-2 hover:text-ink text-base">Analyses</Link>
          <Link href="/pronostics" aria-current={isActive("/pronostics") ? "page" : undefined} className="nav-link block px-3 py-2 hover:text-ink text-base">Pronostics</Link>
          <Link href="/resultats" aria-current={isActive("/resultats") ? "page" : undefined} className="nav-link block px-3 py-2 hover:text-ink text-base">Résultats</Link>
          <Link href="/contact" aria-current={isActive("/contact") ? "page" : undefined} className="nav-link block px-3 py-2 hover:text-ink text-base">Contact</Link>
          {isAdmin && <Link href="/admin" aria-current={isActive("/admin") ? "page" : undefined} className="nav-link block px-3 py-2 text-primary font-bold text-base">Admin</Link>}

          <div className="pt-3 border-t border-line/10 space-y-3">
            {session ? (
              <>
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <span className="block text-sm text-muted truncate">{session.user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="block text-sm font-bold text-red-400 hover:text-red-300 transition"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block hover:text-ink transition font-bold py-1">Connexion</Link>
                <Link href="/signup" className="block text-primary font-bold hover:underline py-1">Inscription</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}