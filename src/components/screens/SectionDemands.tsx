'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  BUYER_LOCATIONS_LIST,
  PRODUCTS_LIST,
  DEMAND_QUALITY_OPTIONS,
  DEMAND_STATUS_LABELS,
} from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import {
  Plus,
  Edit3,
  X,
  Search,
  Trash2,
  ShoppingBag,
  Leaf,
  Package,
  Tag,
  MapPin,
  ArrowRight,
  RotateCcw,
  Phone,
  ArrowLeft,
  LogOut,
  User,
} from 'lucide-react';

export const SectionDemands: React.FC = () => {
  const {
    currentUser,
    allUsers,
    notify,
    setActiveSection,
    pendingFormAction,
    setPendingFormAction,
    isExplicitlyAuthenticated,
    startDepositDemand,
    sectionResetNonce,
    logout,
  } = useApp();

  const [demands, setDemands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const canCreateDemand =
    currentUser?.role === 'ADMINISTRATEUR' || currentUser?.role === 'ACHETEUR';

  const [showForm, setShowForm] = useState(
    () => pendingFormAction === 'NEW_DEMAND' && canCreateDemand && isExplicitlyAuthenticated
  );
  const [editingDemand, setEditingDemand] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'STATUS' | 'DELETE';
    demand: any;
    nextStatus?: 'ACTIVE' | 'CLOTUREE';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const buyers = allUsers.filter((u) => u.role === 'ACHETEUR');
  const [buyerId, setBuyerId] = useState('');
  const [product, setProduct] = useState<string>(PRODUCTS_LIST[0]);
  const [quantityValue, setQuantityValue] = useState<number | ''>(3000);
  const [quantityUnit, setQuantityUnit] = useState<'KG' | 'TONNE'>('KG');
  const [maxPricePerKg, setMaxPricePerKg] = useState<number | ''>(400);
  const [location, setLocation] = useState(BUYER_LOCATIONS_LIST[0].name);
  const [desiredDate, setDesiredDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [quality, setQuality] = useState<string>(DEMAND_QUALITY_OPTIONS[0]);
  const [saving, setSaving] = useState(false);

  const fetchDemands = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProduct) params.set('product', filterProduct);
    if (filterStatus) params.set('status', filterStatus);
    if (onlyMine && currentUser?.role === 'ACHETEUR') {
      params.set('buyerId', currentUser.id);
    }

    fetch(`/api/demands?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.demands) setDemands(d.demands);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterProduct, filterStatus, onlyMine, currentUser]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands, refreshNonce]);

  useSupabaseRealtime(['Demand'], fetchDemands);

  useEffect(() => {
    if (currentUser?.role !== 'ACHETEUR') {
      setOnlyMine(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === 'ACHETEUR') {
      setBuyerId(currentUser.id);
      const validBuyerLoc = BUYER_LOCATIONS_LIST.some(
        (loc) => loc.name === currentUser.location
      );
      setLocation(validBuyerLoc ? currentUser.location : BUYER_LOCATIONS_LIST[0].name);
    } else if (!buyerId && buyers.length > 0) {
      setBuyerId(buyers[0].id);
    }
  }, [currentUser, buyers, buyerId]);

  const canManageDemand = (demandBuyerId: string) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMINISTRATEUR' || currentUser.id === demandBuyerId;
  };

  const handleOpenNew = useCallback(() => {
    setEditingDemand(null);
    setProduct(PRODUCTS_LIST[0]);
    setQuantityValue(3000);
    setQuantityUnit('KG');
    setMaxPricePerKg(400);
    const validBuyerLoc = BUYER_LOCATIONS_LIST.some(
      (loc) => loc.name === currentUser?.location
    )
      ? currentUser!.location
      : BUYER_LOCATIONS_LIST[0].name;
    setLocation(
      currentUser?.role === 'ACHETEUR' ? validBuyerLoc : BUYER_LOCATIONS_LIST[0].name
    );
    const nextDate = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    setDesiredDate(nextDate.toISOString().split('T')[0]);
    setQuality(DEMAND_QUALITY_OPTIONS[0]);
    setShowForm(true);
  }, [currentUser?.location, currentUser?.role]);

  useEffect(() => {
    if (pendingFormAction === 'NEW_DEMAND' && canCreateDemand && isExplicitlyAuthenticated) {
      handleOpenNew();
      setPendingFormAction(null);
    }
  }, [pendingFormAction, canCreateDemand, isExplicitlyAuthenticated, handleOpenNew, setPendingFormAction]);

  const prevResetNonce = useRef(sectionResetNonce);
  useEffect(() => {
    if (sectionResetNonce !== prevResetNonce.current) {
      prevResetNonce.current = sectionResetNonce;
      setShowForm(false);
      setEditingDemand(null);
    }
  }, [sectionResetNonce]);

  const handleOpenEdit = (dem: any) => {
    setEditingDemand(dem);
    setBuyerId(dem.buyerId);
    setProduct(dem.product);
    setQuantityValue(dem.quantityValue);
    setQuantityUnit(dem.quantityUnit);
    setMaxPricePerKg(dem.maxPricePerKg);
    setLocation(dem.location);
    setDesiredDate(new Date(dem.desiredDate).toISOString().split('T')[0]);
    setQuality(dem.quality);
    setShowForm(true);
  };

  const handleSaveDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDemand) {
        const res = await fetch(`/api/demands/${editingDemand.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product,
            quantityValue: Number(quantityValue),
            quantityUnit,
            maxPricePerKg: Number(maxPricePerKg),
            location,
            desiredDate,
            quality,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification.');
        notify('Demande d’achat mise à jour avec succès.', 'success');
      } else {
        const res = await fetch('/api/demands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            buyerId: currentUser?.role === 'ACHETEUR' ? currentUser.id : buyerId,
            product,
            quantityValue: Number(quantityValue),
            quantityUnit,
            maxPricePerKg: Number(maxPricePerKg),
            location,
            desiredDate,
            quality,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');
        notify('Demande d’achat publiée avec succès.', 'success');
      }
      setFilterStatus('');
      setFilterProduct('');
      setSearchQuery('');
      setShowForm(false);
      setEditingDemand(null);
      setRefreshNonce((n) => n + 1);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleExecuteConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'DELETE') {
        const res = await fetch(`/api/demands/${confirmAction.demand.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');
        notify('Demande d’achat supprimée.', 'success');
      } else if (confirmAction.type === 'STATUS' && confirmAction.nextStatus) {
        const res = await fetch(`/api/demands/${confirmAction.demand.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: confirmAction.nextStatus }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de statut.');
        notify(
          confirmAction.nextStatus === 'CLOTUREE'
            ? 'Demande d’achat clôturée.'
            : 'Demande d’achat réactivée.',
          'success'
        );
      }
      setConfirmAction(null);
      setRefreshNonce((n) => n + 1);
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const displayedDemands = demands.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.product.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q) ||
      (d.buyer?.name && d.buyer.name.toLowerCase().includes(q))
    );
  });

  const normalizedConversionText = (() => {
    const val = Number(quantityValue);
    if (!Number.isFinite(val) || val <= 0) return '';
    return quantityUnit === 'TONNE'
      ? `Équivaut à ${(val * 1000).toLocaleString('fr-FR')} kg`
      : `Équivaut à ${(val / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} tonne(s)`;
  })();

  const isBuyerUser = currentUser?.role === 'ACHETEUR';
  const hasActiveFilters = Boolean(filterProduct || filterStatus || searchQuery.trim() || onlyMine);

  const handleResetFilters = () => {
    setFilterProduct('');
    setFilterStatus('');
    setSearchQuery('');
    setOnlyMine(false);
  };

  const handleTriggerNewDemand = () => {
    if (!isExplicitlyAuthenticated || !canCreateDemand) {
      startDepositDemand();
    } else {
      handleOpenNew();
    }
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="max-w-2xl mx-auto py-2 space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingDemand(null);
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-amber-950/10 text-xs font-semibold text-[#5B4834] hover:text-[#14231B] hover:border-amber-300 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour aux demandes</span>
          </button>

          <div className="anim-hero-card bg-white/95 backdrop-blur-md rounded-[2rem] border border-emerald-950/[0.08] shadow-[0_24px_65px_-20px_rgba(180,83,9,0.13)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600" />

            <div className="p-6 sm:p-9 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-emerald-950/[0.07]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#FEF7EB] border border-amber-200/80 text-amber-700 flex items-center justify-center shrink-0 shadow-sm">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF9EF] border border-amber-200/70 text-[11px] font-semibold text-amber-900 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 anim-pulse-amber" />
                      <span>Espace Acheteur</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14231B] tracking-tight">
                      {editingDemand
                        ? 'Modifier la demande d’achat'
                        : 'Publier une nouvelle demande d’achat'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
                      Précisez la variété d’oignon recherchée, la quantité, votre budget et votre zone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDemand(null);
                  }}
                  className="w-9 h-9 rounded-full bg-[#FAF8F4] hover:bg-amber-50 border border-amber-950/[0.08] text-[#5C6B63] hover:text-[#14231B] flex items-center justify-center transition-colors shrink-0"
                  title="Fermer"
                  aria-label="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDemand} className="space-y-5">
                {currentUser?.role === 'ADMINISTRATEUR' && !editingDemand && (
                  <div>
                    <label className="block text-xs font-semibold text-[#2B3E33] mb-1.5">
                      Acheteur *
                    </label>
                    <select
                      value={buyerId}
                      onChange={(e) => setBuyerId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all"
                    >
                      {buyers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.location})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="demand-product"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Variété d’oignon recherchée *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700/80">
                      <Leaf className="w-4 h-4" />
                    </span>
                    <select
                      id="demand-product"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-medium text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all"
                    >
                      {PRODUCTS_LIST.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="demand-qty"
                      className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                    >
                      Quantité souhaitée *
                    </label>
                    <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                          <Package className="w-4 h-4" />
                        </span>
                        <input
                          id="demand-qty"
                          type="number"
                          required
                          min={0.1}
                          step="any"
                          value={quantityValue}
                          onChange={(e) =>
                            setQuantityValue(e.target.value ? Number(e.target.value) : '')
                          }
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-semibold text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all"
                        />
                      </div>

                      <div className="inline-flex p-1 rounded-xl bg-[#FAF6EE] border border-amber-200/80 shrink-0">
                        <button
                          type="button"
                          onClick={() => setQuantityUnit('KG')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            quantityUnit === 'KG'
                              ? 'bg-amber-700 text-white shadow-sm'
                              : 'text-[#61564A] hover:text-[#14231B]'
                          }`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuantityUnit('TONNE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            quantityUnit === 'TONNE'
                              ? 'bg-amber-700 text-white shadow-sm'
                              : 'text-[#61564A] hover:text-[#14231B]'
                          }`}
                        >
                          tonnes
                        </button>
                      </div>
                    </div>
                    {normalizedConversionText && (
                      <span className="inline-block text-[11px] font-medium text-amber-900 bg-[#FFF9EF] border border-amber-200/70 px-2.5 py-0.5 rounded-full mt-2">
                        {normalizedConversionText}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="demand-price"
                      className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                    >
                      Budget max (FCFA / kg) *
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                        <Tag className="w-4 h-4" />
                      </span>
                      <input
                        id="demand-price"
                        type="number"
                        required
                        min={1}
                        value={maxPricePerKg}
                        onChange={(e) =>
                          setMaxPricePerKg(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full pl-10 pr-24 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-semibold text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-[11px] font-semibold text-[#5C6B63]">
                        FCFA / kg
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="demand-location"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Localisation de livraison *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <select
                      id="demand-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-600/10 transition-all"
                    >
                      {BUYER_LOCATIONS_LIST.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-emerald-950/[0.07]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingDemand(null);
                    }}
                    className="px-5 py-3 rounded-2xl text-sm font-medium text-[#3C5447] bg-white border border-[#D5E0D8] hover:bg-[#F5F9F6] transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="group anim-card-shine inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#B45309] to-amber-600 hover:from-[#92400E] hover:to-amber-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all"
                  >
                    <span>
                      {saving
                        ? 'Enregistrement...'
                        : editingDemand
                        ? 'Mettre à jour'
                        : 'Publier la demande'}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 anim-section-in">
          {/* Barre Retour & Déconnexion */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() =>
                setActiveSection(
                  currentUser?.role === 'ADMINISTRATEUR' ? 'TABLEAU_DE_BORD' : 'ACCUEIL'
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-amber-300 shadow-sm transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {currentUser?.role === 'ADMINISTRATEUR'
                  ? 'Retour au tableau de bord'
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

          {/* En-tête épuré Espace Acheteurs (Demandes uniquement) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FEFBF5] via-white to-[#FFF8EC] border border-amber-200/70 p-6 sm:p-8 shadow-[0_14px_40px_-20px_rgba(180,83,9,0.14)]">
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200/80 text-[11px] font-semibold text-amber-900 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 anim-pulse-amber" />
                    <span>
                      {isBuyerUser && currentUser?.name
                        ? `Espace Acheteur · ${currentUser.name}`
                        : 'Espace Acheteurs'}
                    </span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#FEF7EB] border border-amber-200/70 text-[11px] font-semibold text-amber-900">
                    {displayedDemands.length}{' '}
                    {displayedDemands.length > 1 ? 'demandes publiées' : 'demande publiée'}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E241B] tracking-tight">
                  Demandes{' '}
                  <span className="font-editorial italic font-semibold text-[#B45309]">
                    d’achat
                  </span>
                </h1>
                <p className="text-sm text-[#5F5346] max-w-xl leading-relaxed">
                  Consultez les besoins d’approvisionnement des acheteurs et grossistes ou déposez
                  votre propre demande.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerNewDemand}
                className="group anim-card-shine w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#B45309] to-amber-600 hover:from-[#92400E] hover:to-amber-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Faire une demande</span>
              </button>
            </div>
          </div>

          {/* Barre de recherche & filtres harmonisée */}
          <div className="bg-white rounded-3xl border border-emerald-950/[0.08] p-4 sm:p-5 shadow-[0_8px_28px_-14px_rgba(20,45,32,0.07)] space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="relative md:col-span-7 lg:col-span-8">
                <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une demande par variété, acheteur ou ville..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D8E2DC] bg-[#FAFBF9] text-sm text-[#14231B] placeholder:text-[#8E9D95] focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7A8C82] hover:text-[#14231B]"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="relative md:col-span-5 lg:col-span-4">
                <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-amber-700/80">
                  <Leaf className="w-4 h-4" />
                </span>
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  aria-label="Filtrer par variété d’oignon"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E2DC] bg-[#FAFBF9] text-sm font-medium text-[#14231B] focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-emerald-950/[0.06]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E7D75] mr-1">
                  Statut :
                </span>
                <div className="inline-flex flex-wrap p-1 rounded-xl bg-[#F4F7F5] border border-emerald-950/[0.06]">
                  {[
                    { value: '', label: 'Toutes' },
                    { value: 'ACTIVE', label: 'Actives' },
                    { value: 'CLOTUREE', label: 'Clôturées' },
                  ].map((tab) => {
                    const active = filterStatus === tab.value;
                    return (
                      <button
                        key={tab.label}
                        type="button"
                        onClick={() => setFilterStatus(tab.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          active
                            ? 'bg-white text-[#14231B] shadow-sm border border-emerald-950/[0.06]'
                            : 'text-[#5C6B63] hover:text-[#14231B]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {isBuyerUser && (
                  <button
                    type="button"
                    onClick={() => setOnlyMine(!onlyMine)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      onlyMine
                        ? 'bg-[#B45309] text-white border-[#B45309] shadow-sm'
                        : 'bg-[#FAFBF9] text-[#344A3D] border-[#D8E2DC] hover:bg-amber-50/70 hover:border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        onlyMine ? 'bg-amber-200' : 'bg-[#9AA8A0]'
                      }`}
                    />
                    <span>Mes demandes uniquement</span>
                  </button>
                )}

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#5C6B63] hover:text-[#14231B] rounded-xl hover:bg-[#F4F7F5] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Réinitialiser</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grille moderne et aérée des demandes d'achat */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="h-52 w-full rounded-3xl bg-white border border-amber-950/[0.06] p-5 anim-skeleton"
                />
              ))}
            </div>
          ) : displayedDemands.length === 0 ? (
            <div className="bg-white rounded-3xl border border-emerald-950/[0.08] px-6 py-14 text-center shadow-sm">
              <div className="max-w-md mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FEF7EB] to-[#FFFBF4] border border-amber-200/80 text-amber-700 mx-auto flex items-center justify-center shadow-sm">
                  <ShoppingBag className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h2 className="font-display text-lg font-bold text-[#14231B]">
                    {onlyMine
                      ? 'Vous n’avez pas encore publié de demande'
                      : 'Aucune demande d’achat enregistrée'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5C6B63] leading-relaxed">
                    Déposez votre besoin en oignons afin que les producteurs puissent vous contacter
                    directement.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerNewDemand}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#B45309] hover:bg-[#92400E] shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Faire une demande</span>
                  </button>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-[#3C5447] bg-[#F5F9F6] hover:bg-emerald-50 border border-emerald-950/[0.08] transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Réinitialiser les filtres</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {displayedDemands.map((dem) => {
                const st = DEMAND_STATUS_LABELS[dem.status] || DEMAND_STATUS_LABELS.ACTIVE;
                const isOwnerOrAdmin = canManageDemand(dem.buyerId);

                return (
                  <article
                    key={dem.id}
                    className="group bg-white rounded-3xl border border-amber-200/70 hover:border-amber-400/80 shadow-[0_10px_30px_-18px_rgba(180,83,9,0.12)] hover:shadow-[0_18px_40px_-16px_rgba(180,83,9,0.18)] transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 sm:p-6 space-y-4">
                      {/* En-tête de carte : Variété + Statut */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-[#FEF7EB] border border-amber-200/70 text-[#B45309] flex items-center justify-center shrink-0">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                          <h3 className="font-display text-base font-bold text-[#0E241B] leading-snug truncate">
                            {dem.product}
                          </h3>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${st.badgeClass}`}
                        >
                          {st.label}
                        </span>
                      </div>

                      {/* Métriques principales : Quantité souhaitée & Budget max */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#FEFBF5] border border-amber-200/60">
                        <div>
                          <span className="text-[11px] font-medium text-[#726454] block">
                            Quantité souhaitée
                          </span>
                          <span className="font-display text-base font-bold text-[#0E241B] block mt-0.5">
                            {dem.quantityValue} {dem.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}
                          </span>
                          {dem.quantityUnit === 'TONNE' && (
                            <span className="text-[11px] text-[#726454]">
                              ({dem.quantityKg.toLocaleString('fr-FR')} kg)
                            </span>
                          )}
                        </div>
                        <div className="border-l border-amber-200/60 pl-3">
                          <span className="text-[11px] font-medium text-[#726454] block">
                            Budget max
                          </span>
                          <span className="font-display text-base font-bold text-[#B45309] block mt-0.5">
                            {dem.maxPricePerKg} FCFA
                          </span>
                          <span className="text-[11px] text-[#726454]">par kg</span>
                        </div>
                      </div>

                      {/* Infos Acheteur, Zone & Contact direct */}
                      <div className="space-y-2 text-xs text-[#544A3E]">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-semibold text-[#14231B] truncate">
                            {dem.buyer?.name || 'Acheteur'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">{dem.location}</span>
                        </div>
                        {dem.buyer?.phone && (
                          <div className="pt-1">
                            <a
                              href={`tel:${dem.buyer.phone.replace(/\s+/g, '')}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF8EE] hover:bg-amber-100/70 border border-amber-200/70 text-xs font-semibold text-[#9A4A10] transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span>{dem.buyer.phone}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions du propriétaire / administrateur */}
                    {isOwnerOrAdmin && (
                      <div className="px-5 sm:px-6 py-3.5 bg-[#FFFDF9] border-t border-amber-950/[0.06] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(dem)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#344A3D] bg-white hover:bg-amber-50 border border-[#D8E2DC] rounded-xl transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'STATUS',
                                demand: dem,
                                nextStatus: dem.status === 'ACTIVE' ? 'CLOTUREE' : 'ACTIVE',
                              })
                            }
                            className="px-3 py-1.5 text-xs font-semibold text-[#5B4834] bg-white hover:bg-amber-50 border border-amber-200/80 rounded-xl transition-colors"
                          >
                            {dem.status === 'ACTIVE' ? 'Clôturer' : 'Réactiver'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'DELETE', demand: dem })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          title="Supprimer cette demande"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === 'DELETE'
            ? 'Confirmer la suppression de la demande'
            : confirmAction?.nextStatus === 'CLOTUREE'
            ? 'Clôturer cette demande d’achat'
            : 'Réactiver cette demande d’achat'
        }
        description={
          confirmAction?.type === 'DELETE' ? (
            <>
              Voulez-vous supprimer définitivement la demande de{' '}
              <strong className="text-slate-900">{confirmAction.demand.product}</strong> (
              {confirmAction.demand.quantityValue}{' '}
              {confirmAction.demand.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}) ?
            </>
          ) : confirmAction?.nextStatus === 'CLOTUREE' ? (
            <>
              Clôturer la demande de{' '}
              <strong className="text-slate-900">{confirmAction.demand.product}</strong> ? Vous
              pourrez la réactiver à tout moment.
            </>
          ) : confirmAction ? (
            <>
              Réactiver la demande de{' '}
              <strong className="text-slate-900">{confirmAction.demand.product}</strong> ?
            </>
          ) : null
        }
        confirmLabel={
          confirmAction?.type === 'DELETE'
            ? 'Supprimer'
            : confirmAction?.nextStatus === 'CLOTUREE'
            ? 'Clôturer'
            : 'Réactiver'
        }
        variant={confirmAction?.type === 'DELETE' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
