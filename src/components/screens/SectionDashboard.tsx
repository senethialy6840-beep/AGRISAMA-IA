'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { DEMAND_STATUS_LABELS, OFFER_STATUS_LABELS, ROLE_LABELS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import {
  Users,
  Package,
  ShoppingBag,
  GitCompare,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Phone,
  LogOut,
} from 'lucide-react';

export const SectionDashboard: React.FC = () => {
  const {
    currentUser,
    setActiveSection,
    startPublishOffer,
    startDepositDemand,
    loginAdmin,
    logout,
  } = useApp();
  const isAdmin = currentUser?.role === 'ADMINISTRATEUR';

  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  const [adminError, setAdminError] = useState('');

  const [stats, setStats] = useState({
    producersCount: 0,
    buyersCount: 0,
    availableOffersCount: 0,
    demandsCount: 0,
    matchesCount: 0,
  });
  const [recentOffers, setRecentOffers] = useState<any[]>([]);
  const [recentDemands, setRecentDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch('/api/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.stats) setStats(data.stats);
        if (data.recentOffers) setRecentOffers(data.recentOffers);
        if (data.recentDemands) setRecentDemands(data.recentDemands);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, currentUser]);

  useSupabaseRealtime(['Offer', 'Demand', 'Match'], fetchDashboard, isAdmin);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSubmitting(true);
    try {
      await loginAdmin(adminIdentifier, adminPassword);
      setAdminPassword('');
    } catch (err: any) {
      setAdminError(err.message || 'Identifiants administrateur invalides.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-4 space-y-4">
        <button
          type="button"
          onClick={() => {
            if (currentUser?.role === 'PRODUCTEUR') {
              setActiveSection('OFFRES');
            } else if (currentUser?.role === 'ACHETEUR') {
              setActiveSection('DEMANDES');
            } else {
              setActiveSection('ACCUEIL');
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-emerald-300 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>
            {currentUser?.role === 'PRODUCTEUR'
              ? 'Retour à mes offres'
              : currentUser?.role === 'ACHETEUR'
              ? 'Retour à mes demandes'
              : 'Retour à l’accueil'}
          </span>
        </button>

        <div className="bg-white rounded-3xl border border-emerald-950/[0.08] shadow-[0_20px_55px_-20px_rgba(20,55,35,0.12)] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800" />
          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-[#EEF9F2] border border-emerald-200/80 text-emerald-700">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-[#14231B]">
                Accès réservé à l’administrateur
              </h1>
              <p className="text-xs sm:text-sm text-[#5C6B63] leading-relaxed">
                Le tableau de bord global est visible uniquement par l’administrateur de la
                plateforme.
              </p>
            </div>

            {adminError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                {adminError}
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="dash-admin-id"
                  className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                >
                  Téléphone ou identifiant administrateur *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="dash-admin-id"
                    type="text"
                    required
                    value={adminIdentifier}
                    onChange={(e) => setAdminIdentifier(e.target.value)}
                    placeholder="Ex : +221 77 900 10 00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="dash-admin-pwd"
                  className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                >
                  Mot de passe administrateur *
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="dash-admin-pwd"
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-800 hover:to-emerald-700 shadow-md transition-all disabled:opacity-60"
              >
                <span>{adminSubmitting ? 'Vérification...' : 'Se connecter en tant qu’administrateur'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Barre de navigation Retour & Déconnexion Admin */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setActiveSection('ACCUEIL')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-emerald-300 shadow-sm transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à l’accueil</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-red-200/80 text-xs font-semibold text-red-700 hover:bg-red-50 shadow-sm transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Déconnexion</span>
        </button>
      </div>
      {/* En-tête exécutif Admin — Vert Forêt Profond (Direction Dribbble SaaS) */}
      <div className="bento-forest relative overflow-hidden rounded-[2rem] p-6 sm:p-8 text-white">
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="hidden sm:block relative w-24 sm:w-28 aspect-[16/10] rounded-2xl overflow-hidden border border-white/25 shadow-lg shrink-0">
              <img
                src="/images/productrice-mobile.jpg"
                alt="Actrice de la filière oignon utilisant AgriSama IA sur mobile"
                className="w-full h-full object-cover object-center"
              />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-emerald-200 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 anim-pulse-dot" />
                <span>Pilotage exclusif · Filière Oignon</span>
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Tableau de{' '}
                <span className="font-editorial italic font-medium text-amber-300">bord</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/85 mt-1.5 max-w-xl">
                {currentUser
                  ? `Espace ${ROLE_LABELS[currentUser.role] || currentUser.role} — Supervision complète des producteurs, acheteurs, offres, demandes et mises en relation.`
                  : 'Supervision globale de la filière oignon.'}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-auto grid grid-cols-1 sm:flex sm:flex-wrap gap-2.5">
            <button
              type="button"
              onClick={startPublishOffer}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white text-[#0F3D2E] hover:bg-emerald-50 shadow-sm transition-all"
            >
              Publier une offre
            </button>
            <button
              type="button"
              onClick={startDepositDemand}
              className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#D97706] hover:bg-[#B45309] text-white shadow-sm transition-all"
            >
              Publier une demande
            </button>
          </div>
        </div>
      </div>

      {/* Les 5 indicateurs essentiels animés */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveSection('PRODUCTEURS')}
          style={{ '--stagger-delay': '0ms' } as React.CSSProperties}
          className="saas-stat-card anim-card-shine anim-stagger text-left group"
        >
          <div className="flex items-center justify-between text-[#5C6B63] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Producteurs inscrits</span>
            <Users className="w-4 h-4 text-emerald-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          </div>
          <div className="font-display text-2xl font-bold text-[#14231B]">
            {loading ? <span className="inline-block h-7 w-12 anim-skeleton" /> : <AnimatedNumber value={stats.producersCount} />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('ACHETEURS')}
          style={{ '--stagger-delay': '60ms' } as React.CSSProperties}
          className="saas-stat-card anim-card-shine anim-stagger text-left group"
        >
          <div className="flex items-center justify-between text-[#5C6B63] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Acheteurs inscrits</span>
            <Users className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          </div>
          <div className="font-display text-2xl font-bold text-[#14231B]">
            {loading ? <span className="inline-block h-7 w-12 anim-skeleton" /> : <AnimatedNumber value={stats.buyersCount} />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('OFFRES')}
          style={{ '--stagger-delay': '120ms' } as React.CSSProperties}
          className="saas-stat-card anim-card-shine anim-stagger text-left group"
        >
          <div className="flex items-center justify-between text-[#5C6B63] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Offres disponibles</span>
            <Package className="w-4 h-4 text-emerald-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          </div>
          <div className="font-display text-2xl font-bold text-[#14231B]">
            {loading ? <span className="inline-block h-7 w-12 anim-skeleton" /> : <AnimatedNumber value={stats.availableOffersCount} />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('DEMANDES')}
          style={{ '--stagger-delay': '180ms' } as React.CSSProperties}
          className="saas-stat-card anim-card-shine anim-stagger text-left group"
        >
          <div className="flex items-center justify-between text-[#5C6B63] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Demandes d’achat</span>
            <ShoppingBag className="w-4 h-4 text-amber-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" />
          </div>
          <div className="font-display text-2xl font-bold text-[#14231B]">
            {loading ? <span className="inline-block h-7 w-12 anim-skeleton" /> : <AnimatedNumber value={stats.demandsCount} />}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('MISE_EN_RELATION')}
          style={{ '--stagger-delay': '240ms' } as React.CSSProperties}
          className="col-span-2 md:col-span-1 saas-stat-card anim-card-shine anim-stagger text-left group"
        >
          <div className="flex items-center justify-between text-[#5C6B63] mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Mises en relation</span>
            <GitCompare className="w-4 h-4 text-emerald-700 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          </div>
          <div className="flex items-end justify-between">
            <div className="font-display text-2xl font-bold text-emerald-700">
              {loading ? <span className="inline-block h-7 w-12 anim-skeleton" /> : <AnimatedNumber value={stats.matchesCount} />}
            </div>
            <div className="flex items-end gap-1 h-6 pb-0.5" aria-hidden="true">
              <span className="w-1.5 h-[45%] bg-emerald-300 rounded-t anim-bar-rise" style={{ '--bar-delay': '180ms' } as React.CSSProperties} />
              <span className="w-1.5 h-[75%] bg-emerald-500 rounded-t anim-bar-rise" style={{ '--bar-delay': '260ms' } as React.CSSProperties} />
              <span className="w-1.5 h-[60%] bg-emerald-400 rounded-t anim-bar-rise" style={{ '--bar-delay': '340ms' } as React.CSSProperties} />
              <span className="w-1.5 h-[95%] bg-emerald-700 rounded-t anim-bar-rise" style={{ '--bar-delay': '420ms' } as React.CSSProperties} />
            </div>
          </div>
        </button>
      </div>

      {/* Dernières offres et dernières demandes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dernières offres */}
        <div className="saas-card overflow-hidden anim-stagger" style={{ '--stagger-delay': '160ms' } as React.CSSProperties}>
          <div className="px-5 py-4 border-b border-emerald-950/[0.07] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#14231B]">Dernières offres de récolte</h2>
            <button
              type="button"
              onClick={() => setActiveSection('OFFRES')}
              className="group text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Tout consulter</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((skeletonIdx) => (
                <div key={skeletonIdx} className="h-14 w-full anim-skeleton" />
              ))}
            </div>
          ) : recentOffers.length === 0 ? (
            <div className="p-6 text-sm text-[#5C6B63]">Aucune offre enregistrée.</div>
          ) : (
            <div className="divide-y divide-emerald-950/[0.05]">
              {recentOffers.map((offer, idx) => {
                const statusInfo = OFFER_STATUS_LABELS[offer.status] || OFFER_STATUS_LABELS.DISPONIBLE;
                return (
                  <div
                    key={offer.id}
                    style={{ '--stagger-delay': `${200 + idx * 55}ms` } as React.CSSProperties}
                    className="anim-stagger px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F5FAF7] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#14231B] truncate">
                        {offer.product} — {offer.quantityValue}{' '}
                        {offer.quantityUnit === 'TONNE' ? 't' : 'kg'}
                      </div>
                      <div className="text-xs text-[#5C6B63] mt-0.5 truncate">
                        {offer.producer?.name} • {offer.location}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-[#14231B]">
                        {offer.pricePerKg} FCFA/kg
                      </div>
                      <span
                        className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border mt-0.5 ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dernières demandes */}
        <div className="saas-card overflow-hidden anim-stagger" style={{ '--stagger-delay': '220ms' } as React.CSSProperties}>
          <div className="px-5 py-4 border-b border-emerald-950/[0.07] flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#14231B]">Dernières demandes d’achat</h2>
            <button
              type="button"
              onClick={() => setActiveSection('DEMANDES')}
              className="group text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Tout consulter</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[0, 1, 2].map((skeletonIdx) => (
                <div key={skeletonIdx} className="h-14 w-full anim-skeleton" />
              ))}
            </div>
          ) : recentDemands.length === 0 ? (
            <div className="p-6 text-sm text-[#5C6B63]">Aucune demande enregistrée.</div>
          ) : (
            <div className="divide-y divide-emerald-950/[0.05]">
              {recentDemands.map((demand, idx) => {
                const statusInfo = DEMAND_STATUS_LABELS[demand.status] || DEMAND_STATUS_LABELS.ACTIVE;
                return (
                  <div
                    key={demand.id}
                    style={{ '--stagger-delay': `${240 + idx * 55}ms` } as React.CSSProperties}
                    className="anim-stagger px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-[#FEFBF5] transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {demand.product} — {demand.quantityValue}{' '}
                        {demand.quantityUnit === 'TONNE' ? 't' : 'kg'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {demand.buyer?.name} • Livraison : {demand.location}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-slate-900">
                        Max {demand.maxPricePerKg} FCFA/kg
                      </div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5">
                        <span
                          className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
