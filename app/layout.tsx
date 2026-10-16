import "./globals.css";
import Header from "@/Components/Header";
import Footer from "@/Components/Footer";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import ServiceWorkerRegister from "@/Components/ServiceWorkerRegister";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: "COTEFLEX | Conseil en Paris Sportifs - Méthode Value & Bankroll",
  description:
    "Conseil en paris sportifs expert : analyses Football, NBA, Tennis. Gestion bankroll, stratégie long terme, ROI vérifié +8.4% sur 847 picks.",
  keywords: ["conseil paris sportifs", "pronostics", "value bet", "bankroll"],
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: "COTEFLEX",
  },
};

const noFlashScript = `
try {
  var theme = localStorage.getItem('theme');
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
} catch(e) { document.documentElement.classList.add('dark'); }
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="theme-color" content="#00bfff" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-bg text-ink">
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main className="max-w-[1280px] mx-auto px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}