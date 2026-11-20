import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriSama IA — Plateforme de mise en relation agricole',
  description:
    'Plateforme professionnelle de mise en relation entre producteurs agricoles de la zone des Niayes et acheteurs au Sénégal.',
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#047857',
};

const CRITICAL_CSS = `
  body { background-color: #f7f9f7; color: #18261f; font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; }
  .saas-shell { display: flex; min-height: 100vh; background-color: #f7f9f7; }
  .saas-sidebar { width: 260px; background-color: #ffffff; border-right: 1px solid #e4ebe6; display: flex; flex-direction: column; flex-shrink: 0; }
  .saas-main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .saas-topbar { height: 64px; background-color: #ffffff; border-bottom: 1px solid #e4ebe6; display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem; position: sticky; top: 0; z-index: 30; }
  .saas-content { flex: 1; max-width: 1280px; width: 100%; margin: 0 auto; padding: 2rem 1.5rem; }
  @media (max-width: 1023px) { .saas-sidebar { display: none; } .saas-content { padding: 1.25rem 1rem; } }
`;

const SW_CLEANUP_SCRIPT = `
  (function() {
    if (typeof window !== 'undefined') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
          for (var i = 0; i < registrations.length; i++) {
            registrations[i].unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          for (var j = 0; j < keys.length; j++) {
            caches.delete(keys[j]);
          }
        });
      }
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${outfit.variable} ${plusJakarta.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: SW_CLEANUP_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
