'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { PRODUCTS_LIST } from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import { RefreshCw, Phone, MapPin, Filter, X, CheckCircle2, ArrowLeft, LogOut } from 'lucide-react';

export const SectionMatching: React.FC = () => {
  const { currentUser, notify, matchFocus, setMatchFocus, setActiveSection, logout } = useApp();

  const [tab, setTab] = useState<'MATCHES' | 'RESERVED'>('MATCHES');
  const [matches, setMatches] = useState<any[]>([]);
  const [reservedOffers, setReservedOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [onlyMyMatches, setOnlyMyMatches] = useState(false);
  const [filterProduct, setFilterProduct] = useState('');

  const [confirmAction, setConfirmAction] = useState<{
    type: 'RESERVE' | 'SELL' | 'RELEASE';
    match?: any;
    offer?: any;
  } | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const matchParams = new URLSearchParams();
      if (filterProduct) matchParams.set('product', filterProduct);
      if (matchFocus?.offerId) matchParams.set('offerId', matchFocus.offerId);
      if (matchFocus?.demandId) matchParams.set('demandId', matchFocus.demandId);
      if (onlyMyMatches && currentUser) {
        if (currentUser.role === 'PRODUCTEUR') matchParams.set('producerId', currentUser.id);
        if (currentUser.role === 'ACHETEUR') matchParams.set('buyerId', currentUser.id);
      }

      const resParams = new URLSearchParams({ status: 'RESERVEE' });
      if (filterProduct) resParams.set('product', filterProduct);
      if (onlyMyMatches && currentUser) {
        if (currentUser.role === 'PRODUCTEUR') resParams.set('producerId', currentUser.id);
        if (currentUser.role === 'ACHETEUR') resParams.set('reservedByOrForBuyerId', currentUser.id);
      }

      const [matchRes, resOfferRes] = await Promise.all([
        fetch(`/api/matches?${matchParams.toString()}`),
        fetch(`/api/offers?${resParams.toString()}`),
      ]);

      const [matchData, resOfferData] = await Promise.all([
        matchRes.json(),
        resOfferRes.json(),
      ]);

      if (matchData.matches) setMatches(matchData.matches);
      if (resOfferData.offers) setReservedOffers(resOfferData.offers);
    } catch {
      // Erreur silencieuse
    } finally {
      setLoading(false);
    }
  }, [onlyMyMatches, filterProduct, matchFocus, currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSupabaseRealtime(['Offer', 'Demand', 'Match'], fetchData);

  const canReserveMatch = (match: any) => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'ADMINISTRATEUR' ||
      currentUser.id === match.demand?.buyerId ||
      currentUser.id === match.offer?.producerId
    );
  };

  const canMarkSold = (offer: any) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMINISTRATEUR' || currentUser.id === offer.producerId;
  };

  const canReleaseReservation = (offer: any) => {
    if (!currentUser) return false;
    return (
      currentUser.role === 'ADMINISTRATEUR' ||
      currentUser.id === offer.producerId ||
      currentUser.id === offer.reservedByUserId ||
      currentUser.id === offer.reservedForDemand?.buyerId
    );
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setSubmittingAction(true);
    try {
      if (confirmAction.type === 'RESERVE' && confirmAction.match) {
        const res = await fetch('/api/matches/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offerId: confirmAction.match.offerId,
            demandId: confirmAction.match.demandId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la réservation.');
        notify('Offre réservée. Elle est désormais visible dans « Offres réservées ».', 'success');
      } else if (confirmAction.type === 'SELL' && confirmAction.offer) {
        const res = await fetch(`/api/offers/${confirmAction.offer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'VENDUE' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la validation.');
        notify('Offre marquée comme vendue.', 'success');
      } else if (confirmAction.type === 'RELEASE' && confirmAction.offer) {
        const res = await fetch(`/api/matches/reserve?offerId=${confirmAction.offer.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l’annulation.');
        notify('Réservation annulée. L’offre est de nouveau disponible.', 'success');
      }

      setConfirmAction(null);
      await fetchData();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Barre de retour cohérente & déconnexion */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setMatchFocus(null);
            if (currentUser?.role === 'ADMINISTRATEUR') {
              setActiveSection('TABLEAU_DE_BORD');
            } else if (currentUser?.role === 'PRODUCTEUR') {
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
            {currentUser?.role === 'ADMINISTRATEUR'
              ? 'Retour au tableau de bord'
              : currentUser?.role === 'PRODUCTEUR'
              ? 'Retour à mes offres et aux demandes'
              : currentUser?.role === 'ACHETEUR'
              ? 'Retour à mes demandes et aux offres'
              : 'Retour à l’accueil'}
          </span>
        </button>

        {currentUser && (
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-red-200/80 text-xs font-semibold text-red-700 hover:bg-red-50 shadow-sm transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        )}
      </div>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-950/[0.08] pb-5">
        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-semibold text-[#14231B]">Mise en relation intelligente</h1>
          <p className="text-sm text-[#5C6B63]">
            Comparaison automatique des offres disponibles et des demandes d’achat selon 5 critères objectifs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {currentUser && currentUser.role !== 'ADMINISTRATEUR' && (
            <button
              type="button"
              onClick={() => setOnlyMyMatches(!onlyMyMatches)}
              className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors ${onlyMyMatches
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
            >
              {onlyMyMatches ? 'Mes éléments uniquement' : 'Filtrer sur mon profil'}
            </button>
          )}

          <button
            type="button"
            onClick={fetchData}
            className="saas-btn-secondary text-xs py-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Onglets Correspondances disponibles vs Offres réservées + filtre produit */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3">
        <div className="w-full sm:w-auto inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTab('MATCHES')}
            className={`flex-1 sm:flex-none text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-colors ${tab === 'MATCHES'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Correspondances ({matches.length})
          </button>
          <button
            type="button"
            onClick={() => setTab('RESERVED')}
            className={`flex-1 sm:flex-none text-center px-3.5 py-2 sm:py-1.5 rounded-lg transition-colors ${tab === 'RESERVED'
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Offres réservées ({reservedOffers.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {matchFocus && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium max-w-full">
              <span className="truncate">Filtre : {matchFocus.label || 'Sélection ciblée'}</span>
              <button
                type="button"
                onClick={() => setMatchFocus(null)}
                className="hover:text-emerald-950 shrink-0"
                aria-label="Retirer le filtre"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 sm:py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 bg-white"
            >
              <option value="">Toutes les variétés</option>
              {PRODUCTS_LIST.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenu de l'onglet actif */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((sk) => (
            <div key={sk} className="saas-card p-5 space-y-4">
              <div className="h-6 w-64 anim-skeleton" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-28 w-full anim-skeleton" />
                <div className="h-28 w-full anim-skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'MATCHES' ? (
        matches.length === 0 ? (
          <div className="saas-card p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#14231B]">
              Aucune correspondance disponible actuellement
            </p>
            <p className="text-xs text-[#5C6B63]">
              Les correspondances apparaissent automatiquement dès qu’une offre disponible et une demande active portent sur des critères compatibles.
            </p>
            {(matchFocus || filterProduct || onlyMyMatches) && (
              <button
                type="button"
                onClick={() => {
                  setMatchFocus(null);
                  setFilterProduct('');
                  setOnlyMyMatches(false);
                }}
                className="saas-btn-secondary text-xs"
              >
                Afficher toutes les correspondances
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, idx) => {
              const offer = match.offer;
              const demand = match.demand;
              const reserveAllowed = canReserveMatch(match);
              const score = Math.max(0, Math.min(100, Number(match.compatibilityScore) || 0));
              const scoreColor =
                score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-emerald-500' : 'bg-amber-500';
              const criteria = [
                { label: 'Quantité', value: match.quantityScore },
                { label: 'Prix', value: match.priceScore },
                { label: 'Localisation', value: match.locationScore },
                { label: 'Disponibilité', value: match.dateScore },
              ];

              return (
                <div
                  key={match.id}
                  style={{ '--stagger-delay': `${Math.min(idx * 65, 390)}ms` } as React.CSSProperties}
                  className="saas-card anim-card-shine anim-stagger p-5 space-y-4 hover:border-emerald-300/80 hover:shadow-[0_14px_34px_-10px_rgba(21,128,61,0.12)] transition-all duration-300"
                >
                  {/* Bandeau supérieur */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-950/[0.06] pb-4">
                    <div className="space-y-2 flex-1 max-w-2xl">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 anim-pulse-dot" />
                          <span>
                            Compatibilité : <AnimatedNumber value={score} suffix=" %" duration={680} />
                          </span>
                        </span>
                        <span className="text-sm font-semibold text-[#14231B]">
                          {offer?.product}
                        </span>
                      </div>

                      {/* Jauge de compatibilité animée */}
                      <div className="w-full max-w-sm h-1.5 rounded-full bg-emerald-950/[0.07] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${scoreColor} anim-bar-fill`}
                          style={{
                            width: `${score}%`,
                            '--bar-delay': `${Math.min(idx * 65 + 100, 480)}ms`,
                          } as React.CSSProperties}
                        />
                      </div>

                      <p className="text-sm text-[#394A40]">{match.explanation}</p>
                    </div>

                    {reserveAllowed && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'RESERVE', match })}
                        className="saas-btn-primary text-xs shrink-0 self-start sm:self-center"
                      >
                        Réserver cette offre
                      </button>
                    )}
                  </div>

                  {/* Comparaison côte à côte */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Colonne Offre Producteur */}
                    <div className="p-4 rounded-lg bg-emerald-50/40 border border-emerald-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-emerald-800">
                          Offre du producteur
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {offer?.producer?.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block">Quantité disponible</span>
                          <span className="font-medium text-slate-900">
                            {offer?.quantityValue}{' '}
                            {offer?.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Prix souhaité</span>
                          <span className="font-medium text-slate-900">
                            {offer?.pricePerKg} FCFA/kg
                          </span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{offer?.location}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a
                            href={`tel:${(offer?.producer?.phone || '').replace(/\s+/g, '')}`}
                            className="font-mono text-emerald-700 hover:underline truncate"
                          >
                            {offer?.producer?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Colonne Demande Acheteur */}
                    <div className="p-4 rounded-lg bg-amber-50/40 border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-amber-800">
                          Demande de l’acheteur
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900">
                        {demand?.buyer?.name}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                        <div>
                          <span className="text-slate-400 block">Quantité souhaitée</span>
                          <span className="font-medium text-slate-900">
                            {demand?.quantityValue}{' '}
                            {demand?.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Prix maximum</span>
                          <span className="font-medium text-slate-900">
                            {demand?.maxPricePerKg} FCFA/kg
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{demand?.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <a
                            href={`tel:${(demand?.buyer?.phone || '').replace(/\s+/g, '')}`}
                            className="font-mono text-amber-800 hover:underline"
                          >
                            {demand?.buyer?.phone}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détail des critères évalués avec mini-jauges animées */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs text-[#5C6B63]">
                    {criteria.map((c, cIdx) => {
                      const val = Math.max(0, Math.min(100, Number(c.value) || 0));
                      return (
                        <div
                          key={c.label}
                          className="px-3 py-2 rounded-lg bg-[#F7FAF8] border border-emerald-950/[0.06] space-y-1.5"
                        >
                          <div className="flex justify-between items-center">
                            <span>{c.label}</span>
                            <span className="font-semibold text-[#14231B]">{val} %</span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-emerald-950/[0.08] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500/85 anim-bar-fill"
                              style={{
                                width: `${val}%`,
                                '--bar-delay': `${Math.min(idx * 65 + 160 + cIdx * 50, 700)}ms`,
                              } as React.CSSProperties}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : reservedOffers.length === 0 ? (
        <div className="saas-card p-8 text-center space-y-2">
          <p className="text-sm font-medium text-[#14231B]">Aucune offre réservée en cours</p>
          <p className="text-xs text-[#5C6B63]">
            Lorsqu’une offre est réservée suite à une mise en relation, elle apparaît ici avec les coordonnées des deux parties jusqu’à la finalisation de la vente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservedOffers.map((offer, idx) => {
            const linkedDemand = offer.reservedForDemand;
            const buyer = linkedDemand?.buyer || offer.reservedByUser;
            return (
              <div
                key={offer.id}
                style={{ '--stagger-delay': `${Math.min(idx * 65, 390)}ms` } as React.CSSProperties}
                className="saas-card anim-card-shine anim-stagger border-amber-200/80 p-5 space-y-4 hover:border-amber-300 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        Réservée
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {offer.product} — {offer.quantityValue}{' '}
                        {offer.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'} ({offer.pricePerKg}{' '}
                        FCFA/kg)
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Producteur : {offer.producer?.name} ({offer.location})
                      {buyer ? ` • Réservée par / pour : ${buyer.name}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {canReleaseReservation(offer) && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'RELEASE', offer })}
                        className="saas-btn-secondary text-xs py-1.5"
                      >
                        Annuler la réservation
                      </button>
                    )}
                    {canMarkSold(offer) && (
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'SELL', offer })}
                        className="saas-btn-primary text-xs py-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirmer la vente</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-500 uppercase">Contact producteur</span>
                    <div className="font-medium text-slate-900">{offer.producer?.name}</div>
                    <div className="text-slate-600 flex items-center gap-3">
                      <span>{offer.location}</span>
                      <a
                        href={`tel:${(offer.producer?.phone || '').replace(/\s+/g, '')}`}
                        className="font-mono text-emerald-700 hover:underline"
                      >
                        {offer.producer?.phone}
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <span className="font-semibold text-slate-500 uppercase">Contact acheteur</span>
                    <div className="font-medium text-slate-900">
                      {buyer ? buyer.name : 'Réservation directe'}
                    </div>
                    {buyer && (
                      <div className="text-slate-600 flex items-center gap-3">
                        <span>{buyer.location}</span>
                        <a
                          href={`tel:${(buyer.phone || '').replace(/\s+/g, '')}`}
                          className="font-mono text-amber-800 hover:underline"
                        >
                          {buyer.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation de réservation / vente / annulation */}
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'RESERVE'
            ? 'Confirmer la réservation de l’offre'
            : confirmAction?.type === 'SELL'
              ? 'Confirmer la conclusion de la vente'
              : 'Annuler la réservation'
        }
        description={
          confirmAction?.type === 'RESERVE' && confirmAction.match ? (
            <>
              Souhaitez-vous réserver l’offre de{' '}
              <strong className="text-slate-900">{confirmAction.match.offer?.product}</strong> de{' '}
              <strong className="text-slate-900">
                {confirmAction.match.offer?.producer?.name}
              </strong>{' '}
              pour la demande de{' '}
              <strong className="text-slate-900">{confirmAction.match.demand?.buyer?.name}</strong> ?
            </>
          ) : confirmAction?.type === 'SELL' && confirmAction.offer ? (
            <>
              L’offre de{' '}
              <strong className="text-slate-900">{confirmAction.offer.product}</strong> passera au
              statut <strong className="text-slate-900">Vendue</strong> et sera retirée des offres
              disponibles.
            </>
          ) : confirmAction?.offer ? (
            <>
              L’offre de{' '}
              <strong className="text-slate-900">{confirmAction.offer.product}</strong> redeviendra{' '}
              <strong className="text-slate-900">Disponible</strong> pour l’ensemble des acheteurs.
            </>
          ) : null
        }
        confirmLabel={
          confirmAction?.type === 'RESERVE'
            ? 'Confirmer la réservation'
            : confirmAction?.type === 'SELL'
              ? 'Marquer comme vendue'
              : 'Annuler la réservation'
        }
        loading={submittingAction}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
