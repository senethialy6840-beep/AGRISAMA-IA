'use client';

import React, { useEffect, useState } from 'react';
import { SectionName, useApp } from '@/context/AppContext';
import { Reveal } from '@/components/ui/Reveal';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MapPin,
  Package,
  ShoppingBag,
  SlidersHorizontal,
  Handshake,
  Leaf,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';

export function LandingPage() {
  const {
    currentUser,
    setActiveSection,
    setPendingFormAction,
    startPublishOffer,
    startDepositDemand,
    openAuth,
  } = useApp();
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEnterApp = (targetSection: SectionName) => {
    setPendingFormAction(null);
    setActiveSection(targetSection);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishOffer = () => {
    startPublishOffer();
  };

  const handleDepositDemand = () => {
    startDepositDemand();
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFBF9] text-[#18261F] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Jauge de progression de lecture fluide */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent pointer-events-none"
      >
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-[width] duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Barre de navigation publique blanche épurée (fidèle à la maquette) */}
      <nav className="bg-white/95 backdrop-blur-xl border-b border-[#0F3D2E]/[0.08] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] sm:h-[82px] flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleScrollTop}
            className="flex items-center text-left py-1 hover:opacity-95 transition-opacity shrink-0"
            title="AgriSama IA — Accueil"
          >
            <img
              src="/logo.jpg"
              alt="AgriSama IA — Connecter producteurs et acheteurs"
              className="h-11 sm:h-14 w-auto object-contain"
            />
          </button>

          {/* Liens de navigation centraux interactifs */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#3C4F45]">
            <button
              type="button"
              onClick={handleScrollTop}
              className="relative py-2 font-semibold text-[#0E5A2F] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-[#0E5A2F]"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => handleEnterApp('OFFRES')}
              className="py-2 hover:text-[#0E5A2F] transition-colors cursor-pointer"
            >
              Producteurs
            </button>
            <button
              type="button"
              onClick={() => handleEnterApp('DEMANDES')}
              className="py-2 hover:text-[#0E5A2F] transition-colors cursor-pointer"
            >
              Acheteurs
            </button>
          </div>

          {/* Action de connexion */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={() =>
                  handleEnterApp(
                    currentUser.role === 'PRODUCTEUR'
                      ? 'OFFRES'
                      : currentUser.role === 'ACHETEUR'
                      ? 'DEMANDES'
                      : 'TABLEAU_DE_BORD'
                  )
                }
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F5D30] hover:bg-[#0B4724] text-white shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                Mon espace
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuth('LOGIN')}
                className="inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0F5D30] hover:bg-[#0B4724] text-white shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Navigation rapide mobile (< md) */}
        <div className="md:hidden border-t border-[#0F3D2E]/[0.06] bg-white/95 px-2 py-1.5">
          <div className="grid grid-cols-3 gap-1 text-center text-xs font-medium text-[#3C4F45]">
            <button
              type="button"
              onClick={handleScrollTop}
              className="py-1.5 rounded-lg bg-[#EEF7F1] text-[#0E5A2F] font-semibold transition-colors"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => handleEnterApp('OFFRES')}
              className="py-1.5 rounded-lg hover:bg-[#F5FAF7] hover:text-[#0E5A2F] transition-colors"
            >
              Producteurs
            </button>
            <button
              type="button"
              onClick={() => handleEnterApp('DEMANDES')}
              className="py-1.5 rounded-lg hover:bg-[#F5FAF7] hover:text-[#0E5A2F] transition-colors"
            >
              Acheteurs
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* HERO SECTION — ÉDITORIAL LUMINEUX COHÉRENT AVEC L’APPLICATION */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-gradient-to-r from-white via-[#F6FBF7] to-[#EAF3EC] border-b border-[#0F3D2E]/[0.08]">
        <div className="relative max-w-[1380px] mx-auto sm:min-h-[440px] md:min-h-[500px] lg:min-h-[580px] xl:min-h-[650px] flex items-center">
          {/* Visuel plein cadre dès sm (640px+) : producteur d’oignons en haut à droite juste à côté d’AgriSama IA */}
          <div className="hidden sm:block absolute inset-0 pointer-events-none overflow-hidden">
            <img
              src="/images/hero-producteur-oignons.jpg"
              alt="Producteur sénégalais tenant une caisse d’oignons violets frais dans les champs des Niayes"
              className="w-full h-full object-cover object-[92%_75%] md:object-[84%_75%] lg:object-[74%_75%]"
            />
            {/* Fondu lumineux à gauche pour la lisibilité du texte sans jamais voiler le producteur à droite */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.90) 30%, rgba(255,255,255,0.48) 46%, rgba(255,255,255,0) 60%)',
              }}
            />
            {/* Fondu discret sur les bords latéraux sur très grands écrans */}
            <div className="hidden 2xl:block absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#EAF3EC] to-transparent" />
            <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white/50 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="w-full sm:w-[56%] md:w-[53%] lg:w-[50%] xl:max-w-[560px]">
              {/* Sur mobile (< 640px), l’image est placée immédiatement en haut à côté d’AgriSama IA */}
              <div className="flex sm:block items-center justify-between gap-3.5">
                <div className="flex-1 min-w-0">
                  {/* Marque cohérente (Outfit + Fraunces éditorial comme le reste de l'application) */}
                  <div className="anim-hero-title font-display text-[2rem] sm:text-4xl md:text-5xl lg:text-[3.75rem] font-bold tracking-tight leading-none">
                    <span className="text-[#0F3D2E]">AgriSama</span>{' '}
                    <span className="font-editorial italic font-semibold text-[#15803d]">IA</span>
                  </div>

                  {/* Accroche principale */}
                  <h1 className="anim-hero-sub font-display mt-3 sm:mt-4 text-[1.25rem] sm:text-2xl md:text-3xl lg:text-[2.65rem] font-bold tracking-tight text-[#0E241B] leading-[1.14]">
                    Connectons{' '}
                    <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                      producteurs
                    </span>{' '}
                    et{' '}
                    <span className="font-editorial italic font-semibold text-[#B45309]">
                      acheteurs
                    </span>{' '}
                    agricoles
                  </h1>
                </div>

                <div className="sm:hidden shrink-0 w-[132px] h-[148px] rounded-2xl overflow-hidden border-2 border-white shadow-[0_14px_30px_-10px_rgba(15,61,46,0.28)] bg-[#E8F2EC]">
                  <img
                    src="/images/hero-producteur-oignons.jpg"
                    alt="Producteur sénégalais tenant une caisse d’oignons violets frais dans les champs des Niayes"
                    className="w-full h-full object-cover object-[76%_28%]"
                  />
                </div>
              </div>

              {/* Sous-titre */}
              <p className="anim-hero-sub mt-4 text-sm sm:text-sm md:text-base text-[#4B5E54] font-normal leading-relaxed max-w-md lg:max-w-lg">
                Une plateforme intelligente pour trouver facilement des acheteurs ou des producteurs d’oignons.
              </p>

              {/* Double CTA principal */}
              <div className="anim-hero-sub mt-6 sm:mt-7 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handlePublishOffer}
                  className="group anim-card-shine inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl text-sm font-semibold bg-[#0F5D30] hover:bg-[#0B4724] text-white shadow-[0_14px_30px_-10px_rgba(15,93,48,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  <span>Publier une offre</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDepositDemand}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl text-sm font-semibold bg-white/95 hover:bg-[#F1FAF4] text-[#0F5D30] border border-[#0F5D30]/45 hover:border-[#0F5D30] shadow-sm hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                >
                  <span>Faire une demande</span>
                </button>
              </div>

              {/* 3 repères de confiance */}
              <div className="anim-hero-sub mt-7 sm:mt-9 lg:mt-11 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 max-w-md lg:max-w-lg">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#0F5D30]/15 flex items-center justify-center text-[#1B7A3D] shadow-sm">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#18261F] leading-snug">
                    Mise en relation<br />intelligente
                  </span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#0F5D30]/15 flex items-center justify-center text-[#1B7A3D] shadow-sm">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#18261F] leading-snug">
                    Marché local<br />et régional
                  </span>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/95 backdrop-blur-sm border border-[#0F5D30]/15 flex items-center justify-center text-[#1B7A3D] shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-semibold text-[#18261F] leading-snug">
                    Solution fiable<br />et simple
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* RUBAN MARQUEE DOUBLE FLUX INFINI (INSPIRATION GESTORA)       */}
      {/* ============================================================ */}
      <section className="py-10 bg-[#FAFBF9] border-b border-emerald-950/[0.06] overflow-hidden">
        <div className="anim-marquee-group relative w-full flex flex-col space-y-4">
          <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-[#FAFBF9] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-[#FAFBF9] to-transparent z-10 pointer-events-none" />

          {/* Piste 1 : défilement fluide vers la gauche (pause au survol) */}
          <div className="flex w-max anim-marquee">
            {[0, 1].map((dup) => (
              <div key={`track-a-${dup}`} aria-hidden={dup === 1} className="flex items-center space-x-4 px-2">
                {[
                  { Icon: Leaf, text: 'Oignon Violet de Galmi', cls: 'bg-[#0F3D2E] text-white' },
                  { Icon: Sparkles, text: 'Oignon Yaakaar', cls: 'bg-[#EDF7F0] text-[#0F3D2E] border border-[#0F3D2E]/15' },
                  { Icon: CheckCircle2, text: 'Oignon Blanc', cls: 'bg-[#FDF4E6] text-[#8A440B] border border-amber-300/60' },
                  { Icon: Leaf, text: 'Oignon Rouge de Potou', cls: 'bg-[#E6F4F1] text-teal-900 border border-teal-200/80' },
                  { Icon: Package, text: 'Oignon Safari', cls: 'bg-[#F0FDF4] text-emerald-900 border border-emerald-200/80' },
                  { Icon: SlidersHorizontal, text: 'Conversion kg & tonnes', cls: 'bg-[#FFF7ED] text-[#9A4A10] border border-orange-200/80' },
                  { Icon: BarChart3, text: 'Calcul objectif 5 critères', cls: 'bg-white text-[#0F3D2E] border border-[#0F3D2E]/12' },
                ].map((item) => {
                  const Icon = item.Icon;
                  return (
                    <div
                      key={`${dup}-${item.text}`}
                      className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap shadow-sm transition-transform duration-200 hover:scale-105 ${item.cls}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Piste 2 : défilement fluide en sens inverse */}
          <div className="flex w-max anim-marquee-reverse">
            {[0, 1].map((dup) => (
              <div key={`track-b-${dup}`} aria-hidden={dup === 1} className="flex items-center space-x-4 px-2">
                {[
                  { Icon: MapPin, text: 'Notto Gouye Diama & Mboro', cls: 'bg-[#C26D1F] text-white' },
                  { Icon: ShoppingBag, text: 'Marchés Castors & Thiaroye', cls: 'bg-[#FDF6EA] text-[#8A440B] border border-amber-200/80' },
                  { Icon: Handshake, text: 'Circuit court sans intermédiaires', cls: 'bg-[#EDF7F0] text-[#0F3D2E] border border-emerald-200/80' },
                  { Icon: CheckCircle2, text: 'Réservation instantanée', cls: 'bg-white text-[#0F3D2E] border border-[#0F3D2E]/12' },
                  { Icon: MapPin, text: 'Potou, Lompoul & Touba', cls: 'bg-[#FFFBEB] text-amber-900 border border-amber-200/80' },
                  { Icon: Sparkles, text: 'Oignons frais des Niayes', cls: 'bg-[#F0F9F4] text-[#0F3D2E] border border-emerald-200/70' },
                ].map((item) => {
                  const Icon = item.Icon;
                  return (
                    <div
                      key={`${dup}-${item.text}`}
                      className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap shadow-sm transition-transform duration-200 hover:scale-105 ${item.cls}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2 : AVANTAGES PRODUCTEUR & ACHETEUR (BENTO ÉDITORIAL) */}
      {/* ============================================================ */}
      <section id="piliers" className="py-16 lg:py-24 bg-white border-b border-[#0F3D2E]/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#15803d]">
              Avantages concrets
            </h2>
            <h3 className="font-display mt-3 text-2xl sm:text-4xl font-bold text-[#0E241B] tracking-tight">
              Pourquoi choisir{' '}
              <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                AgriSama IA
              </span>{' '}
              ?
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[#55665D]">
              Une plateforme pensée exclusivement pour rapprocher le producteur d’oignons et l’acheteur.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Pilier 1 : Producteur */}
            <Reveal delay={0} className="h-full">
              <div className="group h-full p-7 sm:p-9 rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-[#F4FAF6] via-[#FAFDFB] to-white hover:border-[#0F3D2E]/30 anim-card-lift anim-card-shine shadow-[0_14px_40px_-20px_rgba(15,61,46,0.12)] hover:shadow-[0_24px_50px_-20px_rgba(15,61,46,0.2)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-emerald-200 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <span className="font-editorial italic text-3xl font-semibold text-[#0F3D2E]/20 group-hover:text-[#0F3D2E]/45 transition-colors">
                      01
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-[#0E241B]">
                    Pour le Producteur d’oignons
                  </h4>
                  <p className="mt-3 text-sm text-[#4D5F55] leading-relaxed">
                    Vendez vos récoltes d’oignons rapidement avant dépréciation. Obtenez un prix rémunérateur bord champ
                    et accédez directement aux centrales d’achat de Dakar et Thiès sans subir les décotes des spéculateurs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePublishOffer}
                  className="mt-8 self-start inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-emerald-200/80 text-xs font-semibold text-[#0F3D2E] hover:bg-[#0F3D2E] hover:text-white hover:border-[#0F3D2E] shadow-sm transition-all"
                >
                  <span>Publier une offre de récolte</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </Reveal>

            {/* Pilier 2 : Acheteur */}
            <Reveal delay={110} className="h-full">
              <div className="group h-full p-7 sm:p-9 rounded-[2rem] border border-amber-200/70 bg-gradient-to-br from-[#FEF9F0] via-[#FFFDF9] to-white hover:border-[#C26D1F]/40 anim-card-lift anim-card-shine shadow-[0_14px_40px_-20px_rgba(180,83,9,0.12)] hover:shadow-[0_24px_50px_-20px_rgba(180,83,9,0.2)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#B45309] text-amber-100 flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="font-editorial italic text-3xl font-semibold text-[#B45309]/20 group-hover:text-[#B45309]/45 transition-colors">
                      02
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-[#0E241B]">
                    Pour l’Acheteur & Commerçant
                  </h4>
                  <p className="mt-3 text-sm text-[#5F5346] leading-relaxed">
                    Sécurisez vos approvisionnements en oignons locaux. Comparez les offres disponibles
                    en temps réel et bénéficiez d’une traçabilité complète sur les parcelles d’origine.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDepositDemand}
                  className="mt-8 self-start inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white border border-amber-200/80 text-xs font-semibold text-[#9A4A10] hover:bg-[#B45309] hover:text-white hover:border-[#B45309] shadow-sm transition-all"
                >
                  <span>Déposer une demande d’achat</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 3 : BENTO GRID DRIBBBLE — ALGORITHME 5 CRITÈRES       */}
      {/* ============================================================ */}
      <section id="algorithme" className="py-16 lg:py-24 bg-[#F5F7F4] border-b border-[#0F3D2E]/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#15803d]">
              Moteur déterministe
            </h2>
            <h3 className="font-display mt-3 text-2xl sm:text-4xl font-bold text-[#0E241B] tracking-tight">
              Une formule objective basée sur{' '}
              <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                5 critères réels
              </span>
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[#55665D]">
              Aucun pourcentage arbitraire. Chaque mise en relation provient d’un calcul transparent
              qui reflète la faisabilité économique et logistique de la transaction.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Carte Bento Forêt Profond (signature visuelle Dribbble) */}
            <Reveal variant="scale" className="h-full">
              <div className="bento-forest h-full rounded-[2rem] p-7 text-white flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Scoring transparent</span>
                  </span>
                  <h4 className="font-display text-2xl font-bold leading-snug text-white">
                    Zéro hasard,{' '}
                    <span className="font-editorial italic font-medium text-emerald-300">
                      100 % mesurable
                    </span>
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                    Chaque offre de récolte et chaque demande d’achat sont croisées en temps réel
                    avec conversion automatique kilogrammes et tonnes.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-emerald-200/90 font-medium">Précision algorithmique</span>
                  <span className="font-display text-lg font-bold text-amber-300">5 axes clés</span>
                </div>
              </div>
            </Reveal>

            {[
              {
                num: '01',
                title: 'Variété d’oignon recherchée',
                desc: 'Validation précise de la variété d’oignon (ex. Oignon Violet de Galmi, Oignon Yaakaar, Oignon Blanc).',
              },
              {
                num: '02',
                title: 'Quantité & Unités',
                desc: 'Conversion mathématique automatique entre kilogrammes et tonnes pour vérifier l’adéquation des volumes.',
              },
              {
                num: '03',
                title: 'Prix & Budget',
                desc: 'Vérification que le tarif bord champ proposé s’intègre dans l’enveloppe budgétaire maximale de l’acheteur.',
              },
              {
                num: '04',
                title: 'Proximité géographique',
                desc: 'Évaluation de l’axe logistique entre la zone de récolte (Niayes) et le point de déchargement urbain.',
              },
              {
                num: '05',
                title: 'Date de disponibilité',
                desc: 'Synchronisation temporelle entre la date de récolte effective et la date limite souhaitée par le commerçant.',
              },
            ].map((item, idx) => (
              <Reveal key={item.num} delay={(idx + 1) * 65} className="h-full">
                <div className="group h-full bg-white p-7 rounded-[2rem] border border-[#0F3D2E]/[0.08] hover:border-emerald-400/70 anim-card-lift anim-card-shine shadow-[0_10px_30px_-18px_rgba(15,61,46,0.1)] hover:shadow-[0_20px_44px_-16px_rgba(15,61,46,0.18)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="w-9 h-9 rounded-2xl bg-[#EEF7F1] text-[#0F3D2E] font-display text-xs font-bold flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0F3D2E] group-hover:text-white">
                        {item.num}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A8C82]">
                        Critère {idx + 1}/5
                      </span>
                    </div>
                    <h4 className="font-display text-base font-bold text-[#0E241B]">{item.title}</h4>
                    <p className="mt-2 text-xs text-[#55665D] leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-5 h-1.5 w-full rounded-full bg-[#0F3D2E]/[0.07] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0F3D2E] via-emerald-500 to-teal-400 anim-bar-fill group-hover:opacity-100 opacity-85 transition-opacity"
                      style={{
                        width: `${100 - idx * 8}%`,
                        '--bar-delay': `${idx * 70 + 180}ms`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 4 : LA ZONE DES NIAYES (AU CŒUR DU DISPOSITIF)        */}
      {/* ============================================================ */}
      <section id="niayes" className="scroll-mt-24 py-16 lg:py-24 bg-white border-b border-[#0F3D2E]/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center overflow-hidden">
            <Reveal variant="left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF7F1] text-[#0F3D2E] text-[11px] font-semibold uppercase tracking-[0.12em] mb-4 border border-emerald-200/70">
                <MapPin className="w-3.5 h-3.5 text-[#15803d]" />
                <span>Premier Bassin d’Oignons du Sénégal</span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#0E241B] leading-[1.15] tracking-tight">
                La zone des Niayes :{' '}
                <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                  nourrir le pays
                </span>{' '}
                et sécuriser les revenus
              </h2>
              <p className="mt-4 text-sm sm:text-base text-[#4D5F55] leading-relaxed">
                S’étendant le long du littoral de Dakar à Saint-Louis, la bande des Niayes produit plus de 80%
                de l’oignon local consommé au Sénégal. AgriSama IA répond au défi majeur de la filière oignon :
                décongestionner les zones de production en période de haute récolte et stabiliser les prix.
              </p>

              {/* Carte statistique éditoriale (sans image) */}
              <div className="mt-6 p-5 rounded-2xl bento-forest text-white flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="font-editorial italic text-4xl font-bold text-amber-300 shrink-0">
                  +80 %
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  de la production nationale d’oignons locaux provient du corridor horticole des Niayes
                  et de la Vallée du Fleuve Sénégal.
                </p>
              </div>

              <div className="mt-6 space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#14231B]">Écoulement rapide anti-gaspillage</h4>
                    <p className="text-xs text-[#5C6B63]">Mise en marché anticipée dès la coupe pour éviter les pourritures sous bâche.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#14231B]">Transparence des cours</h4>
                    <p className="text-xs text-[#5C6B63]">Fin des asymétries d’information entre les producteurs et les marchés de gros.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#14231B]">Soutien à la souveraineté alimentaire</h4>
                    <p className="text-xs text-[#5C6B63]">Valorisation prioritaire de la production locale face aux importations.</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Pôles territoriaux */}
            <Reveal variant="right" delay={120} className="bg-[#F6F9F7] rounded-3xl p-6 border border-emerald-950/[0.06]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5C6B63] mb-4">
                Pôles de récolte et marchés connectés
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-emerald-950/[0.06] hover:border-emerald-300/80 hover:translate-x-1.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div>
                    <strong className="text-xs text-[#14231B] block">Notto Gouye Diama & Mboro</strong>
                    <span className="text-[11px] text-[#5C6B63]">Bassin historique de l’oignon violet de Galmi</span>
                  </div>
                  <span className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse-dot" />
                    <span>Production</span>
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-950/[0.06] hover:border-emerald-300/80 hover:translate-x-1.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div>
                    <strong className="text-xs text-[#14231B] block">Potou & Lompoul</strong>
                    <span className="text-[11px] text-[#5C6B63]">Grandes parcelles d’oignons des Niayes</span>
                  </div>
                  <span className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse-dot" />
                    <span>Production</span>
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-950/[0.06] hover:border-amber-300/80 hover:translate-x-1.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div>
                    <strong className="text-xs text-[#14231B] block">Marchés de Dakar (Castors, Thiaroye, Sandaga)</strong>
                    <span className="text-[11px] text-[#5C6B63]">Premier centre de consommation urbain du pays</span>
                  </div>
                  <span className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 anim-pulse-amber" />
                    <span>Débouché</span>
                  </span>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-emerald-950/[0.06] hover:border-amber-300/80 hover:translate-x-1.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                  <div>
                    <strong className="text-xs text-[#14231B] block">Thiès, Touba & Saint-Louis</strong>
                    <span className="text-[11px] text-[#5C6B63]">Marchés régionaux et centrales de distribution</span>
                  </div>
                  <span className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 anim-pulse-amber" />
                    <span>Débouché</span>
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 5 : COMMENT ÇA FONCTIONNE (3 ÉTAPES ARCHITECTURALES)  */}
      {/* ============================================================ */}
      <section className="py-16 lg:py-24 bg-[#F5F7F4] border-b border-[#0F3D2E]/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#15803d]">
              Simplicité d’usage
            </h2>
            <h3 className="font-display mt-3 text-2xl sm:text-4xl font-bold text-[#0E241B] tracking-tight">
              Comment{' '}
              <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                ça fonctionne
              </span>{' '}
              ?
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[#55665D]">
              Un parcours intuitif pensé pour être utilisé sur ordinateur, tablette ou smartphone.
            </p>
          </Reveal>

          <div className="relative">
            {/* Connecteur animé reliant les 3 étapes sur écran large */}
            <svg
              className="hidden md:block absolute top-14 left-[18%] right-[18%] w-[64%] h-4 pointer-events-none"
              viewBox="0 0 600 20"
              fill="none"
              aria-hidden="true"
            >
              <line
                x1="0"
                y1="10"
                x2="600"
                y2="10"
                stroke="#0F3D2E"
                strokeOpacity="0.25"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="anim-dash-flow"
              />
            </svg>

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
              <Reveal delay={0} className="h-full">
                <div className="group h-full bg-white p-7 sm:p-8 rounded-[2rem] border border-[#0F3D2E]/[0.08] hover:border-emerald-400/70 anim-card-lift anim-card-shine shadow-[0_10px_30px_-18px_rgba(15,61,46,0.1)] hover:shadow-[0_22px_45px_-18px_rgba(15,61,46,0.18)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-editorial italic text-4xl font-bold text-[#0F3D2E]/25 group-hover:text-[#0F3D2E] transition-colors">
                        01
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#EEF7F1] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0F3D2E]">
                        Annonce
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-[#0E241B]">
                      Publication de l’annonce
                    </h4>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#55665D] leading-relaxed">
                      Le producteur indique sa récolte disponible (variété, volume en kg/tonnes, prix souhaité, date).
                      L’acheteur formule son besoin et son plafond budgétaire.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={90} className="h-full">
                <div className="group h-full bg-white p-7 sm:p-8 rounded-[2rem] border border-[#0F3D2E]/[0.08] hover:border-emerald-400/70 anim-card-lift anim-card-shine shadow-[0_10px_30px_-18px_rgba(15,61,46,0.1)] hover:shadow-[0_22px_45px_-18px_rgba(15,61,46,0.18)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-editorial italic text-4xl font-bold text-emerald-600/35 group-hover:text-emerald-700 transition-colors">
                        02
                      </span>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-800">
                        Scoring IA
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-[#0E241B]">
                      Calcul automatique du score
                    </h4>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#55665D] leading-relaxed">
                      L’algorithme croise l’offre et la demande sur les 5 critères et calcule un pourcentage
                      de compatibilité réel assorti d’une explication courte et claire.
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={180} className="h-full">
                <div className="group h-full bg-white p-7 sm:p-8 rounded-[2rem] border border-[#0F3D2E]/[0.08] hover:border-amber-400/70 anim-card-lift anim-card-shine shadow-[0_10px_30px_-18px_rgba(15,61,46,0.1)] hover:shadow-[0_22px_45px_-18px_rgba(180,83,9,0.18)] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="font-editorial italic text-4xl font-bold text-amber-600/35 group-hover:text-[#B45309] transition-colors">
                        03
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#FDF4E6] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9A4A10]">
                        Accord direct
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-[#0E241B]">
                      Mise en relation & Accord
                    </h4>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#55665D] leading-relaxed">
                      Les coordonnées directes sont partagées. L’offre peut être réservée puis marquée comme vendue,
                      garantissant un suivi rigoureux des stocks.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 6 : ESPACES DÉDIÉS SELON LES PROFILS                 */}
      {/* ============================================================ */}
      <section id="espaces" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#15803d]">
              Espaces utilisateurs
            </h2>
            <h3 className="font-display mt-3 text-2xl sm:text-4xl font-bold text-[#0E241B] tracking-tight">
              Accédez selon{' '}
              <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                votre rôle
              </span>
            </h3>
            <p className="mt-3 text-sm sm:text-base text-[#55665D]">
              Choisissez votre profil pour ouvrir directement l’espace adapté à votre activité.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {/* Profil Producteur (sans image, disposition éditoriale épurée) */}
            <Reveal variant="scale" delay={0} className="h-full">
              <div id="espace-producteur" className="scroll-mt-24 group h-full bg-[#F8FCF9] rounded-[2rem] overflow-hidden border border-emerald-200/70 shadow-[0_14px_40px_-20px_rgba(15,61,46,0.12)] hover:shadow-[0_24px_54px_-18px_rgba(15,61,46,0.22)] flex flex-col justify-between hover:border-[#0F3D2E]/35 anim-card-lift anim-card-shine">
                <div className="p-6 sm:p-8 pb-0">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#0F3D2E] text-emerald-200 flex items-center justify-center shadow-sm">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200/80 text-[11px] font-semibold text-[#0F3D2E] shadow-sm">
                      <span>Récoltes d’oignons</span>
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-[#0E241B]">Espace Producteur</h4>
                  <p className="mt-2 text-xs sm:text-sm text-[#4D5F55] leading-relaxed">
                    Gérez vos récoltes, publiez vos volumes disponibles et présentez directement vos
                    productions aux acheteurs d’oignons.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[#4D5F55]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Publication d’offres en kg ou tonnes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Statuts : Disponible, Réservée, Vendue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Contact direct sans intermédiaires</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 sm:p-8 pt-6">
                  <button
                    type="button"
                    onClick={handlePublishOffer}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-[#0F3D2E] text-white hover:bg-[#134E3A] active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>Démarrer comme Producteur</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Profil Acheteur (sans image, disposition éditoriale épurée) */}
            <Reveal variant="scale" delay={110} className="h-full">
              <div id="espace-acheteur" className="scroll-mt-24 group h-full bg-[#FEFBF5] rounded-[2rem] overflow-hidden border border-amber-200/70 shadow-[0_14px_40px_-20px_rgba(180,83,9,0.12)] hover:shadow-[0_24px_54px_-18px_rgba(180,83,9,0.22)] flex flex-col justify-between hover:border-[#C26D1F]/40 anim-card-lift anim-card-shine">
                <div className="p-6 sm:p-8 pb-0">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#B45309] text-amber-100 flex items-center justify-center shadow-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200/80 text-[11px] font-semibold text-[#8A440B] shadow-sm">
                      <span>Grossistes & Marchés</span>
                    </span>
                  </div>
                  <h4 className="font-display text-xl font-bold text-[#0E241B]">
                    Espace Acheteur & Grossiste
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-[#5F5346] leading-relaxed">
                    Déposez vos besoins en approvisionnement, définissez votre budget maximal et découvrez
                    les lots d’oignons des Niayes.
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-[#5F5346]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Publication de demandes d’achat</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Filtre par variété et zone de livraison</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Contact direct avec les producteurs</span>
                    </li>
                  </ul>
                </div>
                <div className="p-6 sm:p-8 pt-6">
                  <button
                    type="button"
                    onClick={handleDepositDemand}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full text-xs sm:text-sm font-semibold bg-[#B45309] text-white hover:bg-[#92400E] active:scale-[0.98] transition-all shadow-md"
                  >
                    <span>Démarrer comme Acheteur</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SECTION 7 : CALL TO ACTION HAUTE-COUTURE VERT FORÊT PROFOND   */}
      {/* ============================================================ */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal variant="scale">
            <div className="bento-forest relative overflow-hidden rounded-[2.25rem] p-8 sm:p-14 text-center anim-card-shine text-white">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 text-emerald-300 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm">
                <Handshake className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight max-w-2xl mx-auto">
                Prêt à commercialiser vos récoltes de façon{' '}
                <span className="font-editorial italic font-medium text-amber-300">
                  intelligente
                </span>{' '}
                ?
              </h2>
              <p className="mt-4 text-sm sm:text-base text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
                Rejoignez dès maintenant AgriSama IA. Connectez votre exploitation ou votre négoce
                à la première plateforme intelligente de la filière oignon sénégalaise.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={handlePublishOffer}
                  className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold bg-white text-[#0F3D2E] hover:bg-emerald-50 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg"
                >
                  <span>Publier une offre de récolte</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
                <button
                  type="button"
                  onClick={handleDepositDemand}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-semibold bg-[#D97706] hover:bg-[#B45309] text-white border border-amber-300/30 hover:-translate-y-0.5 active:scale-95 transition-all shadow-lg"
                >
                  <span>Déposer une demande d’achat</span>
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PIED DE PAGE SOFT ET HARMONIEUX                               */}
      {/* ============================================================ */}
      <footer className="bg-[#F3F6F4] text-[#5C6B63] py-12 border-t border-emerald-950/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="inline-flex bg-white px-3 py-2 rounded-xl border border-emerald-950/[0.08] shadow-sm">
                <img
                  src="/logo.jpg"
                  alt="AgriSama IA — Connecter producteurs et acheteurs"
                  className="h-11 sm:h-12 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-[#5C6B63] leading-relaxed">
                Plateforme intelligente de mise en relation entre producteurs et acheteurs d’oignons.
                Conçue pour la filière oignon de la zone des Niayes au Sénégal.
              </p>
              <div className="text-[11px] text-emerald-700 font-semibold">
                Connecter producteurs et acheteurs
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#14231B] uppercase tracking-wider mb-3">
                Navigation applicative
              </h4>
              <ul className="space-y-2 text-xs">
                {currentUser?.role === 'ADMINISTRATEUR' && (
                  <li>
                    <button
                      type="button"
                      onClick={() => handleEnterApp('TABLEAU_DE_BORD')}
                      className="hover:text-emerald-700 transition-colors font-semibold text-emerald-800"
                    >
                      Tableau de bord (Admin)
                    </button>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => handleEnterApp('PRODUCTEURS')}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    Producteurs enregistrés
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleEnterApp('OFFRES')}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    Offres de récolte
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleEnterApp('ACHETEURS')}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    Acheteurs enregistrés
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleEnterApp('DEMANDES')}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    Demandes d’achat
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => openAuth('LOGIN')}
                    className="hover:text-emerald-700 transition-colors"
                  >
                    Connexion / Inscription
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#14231B] uppercase tracking-wider mb-3">
                Périmètre territorial
              </h4>
              <p className="text-xs text-[#5C6B63] leading-relaxed">
                Zone des Niayes (Notto Gouye Diama, Mboro, Potou, Lompoul, Kayar) et marchés de distribution
                de Dakar (Castors, Thiaroye, Sandaga), Thiès, Touba, Louga et Saint-Louis.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#14231B] uppercase tracking-wider mb-3">
                Charte & Engagements
              </h4>
              <p className="text-xs text-[#5C6B63] leading-relaxed">
                Algorithme objectif sur 5 critères vérifiés, calcul déterministe transparent,
                zéro emoji, interface épurée et respect scrupuleux de l’économie de l’oignon au Sénégal.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-emerald-950/[0.07] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6E7D75] gap-4">
            <span>© 2026 AgriSama IA. Tous droits réservés.</span>
            <span>Filière Oignon des Niayes · République du Sénégal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
