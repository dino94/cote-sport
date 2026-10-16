"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log("✅ beforeinstallprompt reçu");
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    console.log("📱 Mode standalone ?", window.matchMedia("(display-mode: standalone)").matches);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) {
      setDebug(true);
      setTimeout(() => setDebug(false), 5000);
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  if (installed) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        className="text-muted hover:text-ink transition w-9 h-9 flex items-center justify-center rounded-full border border-line/10 hover:border-primary/30 text-lg"
        aria-label="Installer l'application"
        title="Installer l'application"
      >
        ⤓
      </button>

      {debug && (
        <div className="fixed top-20 right-4 bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-xl px-4 py-3 text-xs max-w-xs z-50">
          Pour installer : ouvrez le menu de votre navigateur → "Installer l'application" ou "Ajouter à l'écran d'accueil"
        </div>
      )}
    </>
  );
}