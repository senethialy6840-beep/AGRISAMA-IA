'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, ArrowRight, Lock, Phone, ShieldCheck } from 'lucide-react';

export default function AdminAccessPage() {
  const router = useRouter();
  const { currentUser, authLoading, loginAdmin } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!authLoading && currentUser?.role === 'ADMINISTRATEUR') {
      router.replace('/?section=TABLEAU_DE_BORD');
    }
  }, [authLoading, currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await loginAdmin(identifier, password);
      router.push('/?section=TABLEAU_DE_BORD');
    } catch (err: any) {
      setErrorMsg(err.message || 'Identifiants administrateur invalides.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-[#F2F8F4] via-[#FAFBF9] to-[#FDF8EE] flex flex-col justify-between py-6 sm:py-8 px-3.5 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 anim-dot-grid"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-20 w-96 h-96 rounded-full bg-emerald-200/35 blur-3xl anim-halo-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-amber-200/25 blur-3xl anim-halo-reverse"
      />

      {/* Barre supérieure */}
      <div className="relative z-10 max-w-md w-full mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-emerald-300 shadow-sm hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Retour à l’accueil</span>
        </button>

        <div className="inline-flex bg-white px-3 py-1.5 rounded-xl border border-emerald-950/[0.08] shadow-sm">
          <img
            src="/logo.jpg"
            alt="AgriSama IA"
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Carte d'authentification administrateur */}
      <div className="relative z-10 max-w-md w-full mx-auto my-8">
        <div className="anim-hero-card bg-white/95 backdrop-blur-md rounded-[2rem] border border-emerald-950/[0.08] shadow-[0_24px_65px_-20px_rgba(20,55,35,0.14)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800" />

          <div className="p-6 sm:p-9 space-y-6">
            <div className="text-center space-y-2.5">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#EEF9F2] border border-emerald-200/80 text-emerald-700 shadow-sm">
                <ShieldCheck className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F9F6] border border-emerald-950/[0.07] text-[11px] font-semibold text-[#3C5447]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 anim-pulse-dot" />
                <span>Accès privé · Tableau de bord</span>
              </div>

              <h1 className="font-display text-2xl font-bold text-[#14231B] tracking-tight">
                Connexion Administrateur
              </h1>
              <p className="text-xs sm:text-sm text-[#5C6B63] leading-relaxed">
                Le tableau de bord de pilotage est réservé exclusivement à l’administrateur de la
                plateforme.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs font-medium text-red-800 anim-section-in">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-identifier"
                  className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                >
                  Téléphone ou identifiant administrateur *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="admin-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ex : +221 77 900 10 00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] placeholder:text-[#9AA8A0] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                >
                  Mot de passe administrateur *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="admin-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] placeholder:text-[#9AA8A0] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="group anim-card-shine w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all"
                >
                  <span>{submitting ? 'Vérification...' : 'Ouvrir le tableau de bord'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="relative z-10 text-center text-xs text-[#6E7D75]">
        AgriSama IA · Administration sécurisée
      </div>
    </div>
  );
}
