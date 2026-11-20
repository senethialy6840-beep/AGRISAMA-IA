'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { SectionDashboard } from '@/components/screens/SectionDashboard';
import { SectionProducers } from '@/components/screens/SectionProducers';
import { SectionOffers } from '@/components/screens/SectionOffers';
import { SectionBuyers } from '@/components/screens/SectionBuyers';
import { SectionDemands } from '@/components/screens/SectionDemands';
import { SectionMatching } from '@/components/screens/SectionMatching';
import { LandingPage } from '@/components/screens/LandingPage';
import { AuthView } from '@/components/screens/AuthView';
import { ROLE_LABELS } from '@/lib/constants';

export default function AgriSamaApp() {
  const {
    currentUser,
    authLoading,
    activeSection,
    setActiveSection,
    notification,
  } = useApp();

  const notificationToast = notification ? (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 sm:bottom-5 z-50 sm:max-w-sm anim-toast-in">
      <div
        className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-emerald-800 text-white border-emerald-900'
            : notification.type === 'error'
            ? 'bg-red-700 text-white border-red-800'
            : 'bg-[#18261F] text-white border-emerald-950'
        }`}
      >
        {notification.message}
      </div>
    </div>
  ) : null;

  if (activeSection === 'ACCUEIL') {
    return (
      <div className="min-h-screen bg-[#FAFBF9] text-[#18261F] flex flex-col">
        <LandingPage />
        {notificationToast}
      </div>
    );
  }

  if (activeSection === 'CONNEXION') {
    return (
      <div className="min-h-screen bg-[#FAFBF9] text-[#18261F] flex flex-col">
        <AuthView />
        {notificationToast}
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBF9] flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[#5C6B63]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 anim-pulse-dot" />
          <span>Chargement de votre espace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] text-[#18261F] flex flex-col">
      {/* Barre d'en-tête SaaS épurée */}
      <header className="bg-white border-b border-emerald-950/[0.08] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-3">
          {/* Logo officiel AgriSama IA */}
          <button
            type="button"
            onClick={() => setActiveSection('ACCUEIL')}
            className="flex items-center gap-2.5 text-left py-1 hover:opacity-95 transition-opacity shrink-0"
            title="Revenir à la page d’accueil"
          >
            <img
              src="/logo.jpg"
              alt="AgriSama IA — Connecter producteurs et acheteurs"
              className="h-11 sm:h-12 w-auto object-contain"
            />
          </button>

          {/* Navigation cohérente dans l'espace applicatif */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#3C4F45]">
            <button
              type="button"
              onClick={() => setActiveSection('ACCUEIL')}
              className="py-2 hover:text-[#0E5A2F] transition-colors"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('OFFRES')}
              className={`relative py-2 transition-colors ${
                activeSection === 'OFFRES' || activeSection === 'PRODUCTEURS'
                  ? "font-semibold text-[#0E5A2F] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-[#0E5A2F]"
                  : 'hover:text-[#0E5A2F]'
              }`}
            >
              Producteurs
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('DEMANDES')}
              className={`relative py-2 transition-colors ${
                activeSection === 'DEMANDES' || activeSection === 'ACHETEURS'
                  ? "font-semibold text-[#0E5A2F] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-[#0E5A2F]"
                  : 'hover:text-[#0E5A2F]'
              }`}
            >
              Acheteurs
            </button>
            {currentUser?.role === 'ADMINISTRATEUR' && (
              <button
                type="button"
                onClick={() => setActiveSection('TABLEAU_DE_BORD')}
                className={`relative py-2 transition-colors ${
                  activeSection === 'TABLEAU_DE_BORD'
                    ? "font-semibold text-[#0E5A2F] after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2.5px] after:rounded-full after:bg-[#0E5A2F]"
                    : 'hover:text-[#0E5A2F]'
                }`}
              >
                Tableau de bord
              </button>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF7F1] border border-emerald-200/80 text-xs font-semibold text-[#0F3D2E]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="max-w-[140px] truncate">{currentUser.name}</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setActiveSection('CONNEXION')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-semibold bg-[#0F5D30] hover:bg-[#0B4724] text-white shadow-sm transition-all"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>

        {/* Navigation rapide mobile dans l'espace applicatif */}
        <div className="md:hidden border-t border-emerald-950/[0.06] bg-white px-2 py-1.5">
          <div
            className={`grid gap-1 text-center text-xs font-medium text-[#3C4F45] ${
              currentUser?.role === 'ADMINISTRATEUR' ? 'grid-cols-4' : 'grid-cols-3'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveSection('ACCUEIL')}
              className="py-1.5 rounded-lg hover:bg-[#F5FAF7]"
            >
              Accueil
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('OFFRES')}
              className={`py-1.5 rounded-lg ${
                activeSection === 'OFFRES' || activeSection === 'PRODUCTEURS'
                  ? 'bg-[#EEF7F1] text-[#0E5A2F] font-semibold'
                  : 'hover:bg-[#F5FAF7]'
              }`}
            >
              Producteurs
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('DEMANDES')}
              className={`py-1.5 rounded-lg ${
                activeSection === 'DEMANDES' || activeSection === 'ACHETEURS'
                  ? 'bg-[#EEF7F1] text-[#0E5A2F] font-semibold'
                  : 'hover:bg-[#F5FAF7]'
              }`}
            >
              Acheteurs
            </button>
            {currentUser?.role === 'ADMINISTRATEUR' && (
              <button
                type="button"
                onClick={() => setActiveSection('TABLEAU_DE_BORD')}
                className={`py-1.5 rounded-lg ${
                  activeSection === 'TABLEAU_DE_BORD'
                    ? 'bg-[#EEF7F1] text-[#0E5A2F] font-semibold'
                    : 'hover:bg-[#F5FAF7]'
                }`}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        <div key={activeSection} className="anim-section-in">
          {activeSection === 'TABLEAU_DE_BORD' && <SectionDashboard />}
          {activeSection === 'PRODUCTEURS' && <SectionProducers />}
          {activeSection === 'OFFRES' && <SectionOffers />}
          {activeSection === 'ACHETEURS' && <SectionBuyers />}
          {activeSection === 'DEMANDES' && <SectionDemands />}
          {activeSection === 'MISE_EN_RELATION' && <SectionMatching />}
        </div>
      </main>

      {/* Pied de page sobre avec logo */}
      <footer className="bg-white/80 border-t border-emerald-950/[0.07] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs text-[#5C6B63] gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
            <div className="inline-flex bg-white px-2.5 py-1.5 rounded-lg border border-emerald-950/[0.08]">
              <img
                src="/logo.jpg"
                alt="AgriSama IA"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </div>
            <span>Plateforme de mise en relation agricole — Filière Oignon des Niayes</span>
          </div>
          <span>
            {currentUser ? (
              <>
                Connecté en tant que :{' '}
                <strong className="text-[#18261F]">{currentUser.name}</strong> (
                {ROLE_LABELS[currentUser.role]})
              </>
            ) : (
              <span>Mode consultation — Connectez-vous pour publier</span>
            )}
          </span>
        </div>
      </footer>

      {notificationToast}
    </div>
  );
}
