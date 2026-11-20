'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import {
  PRODUCTS_LIST,
  PRODUCER_LOCATIONS_LIST,
  QUALITY_OPTIONS,
  OFFER_STATUS_LABELS,
} from '@/lib/constants';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
import {
  Plus,
  Edit3,
  X,
  Search,
  Trash2,
  ArrowRight,
  Leaf,
  MapPin,
  Package,
  Tag,
  Phone,
  RotateCcw,
  ArrowLeft,
  LogOut,
  ImagePlus,
  User,
} from 'lucide-react';

export const SectionOffers: React.FC = () => {
  const {
    currentUser,
    allUsers,
    notify,
    setActiveSection,
    pendingFormAction,
    setPendingFormAction,
    isExplicitlyAuthenticated,
    startPublishOffer,
    sectionResetNonce,
    logout,
  } = useApp();

  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  const canCreateOffer =
    currentUser?.role === 'ADMINISTRATEUR' || currentUser?.role === 'PRODUCTEUR';

  const [showForm, setShowForm] = useState(
    () => pendingFormAction === 'NEW_OFFER' && canCreateOffer && isExplicitlyAuthenticated
  );
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'STATUS' | 'DELETE';
    offer: any;
    nextStatus?: 'DISPONIBLE' | 'RESERVEE' | 'VENDUE';
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const producers = allUsers.filter((u) => u.role === 'PRODUCTEUR');
  const [producerId, setProducerId] = useState('');
  const [product, setProduct] = useState<string>(PRODUCTS_LIST[0]);
  const [quantityValue, setQuantityValue] = useState<number | ''>(2000);
  const [quantityUnit, setQuantityUnit] = useState<'KG' | 'TONNE'>('KG');
  const [pricePerKg, setPricePerKg] = useState<number | ''>(380);
  const [location, setLocation] = useState(PRODUCER_LOCATIONS_LIST[0].name);
  const [availableDate, setAvailableDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [quality, setQuality] = useState<string>(QUALITY_OPTIONS[0]);
  const [status, setStatus] = useState<'DISPONIBLE' | 'RESERVEE' | 'VENDUE'>('DISPONIBLE');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchOffers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterProduct) params.set('product', filterProduct);
    if (onlyMine && currentUser?.role === 'PRODUCTEUR') {
      params.set('producerId', currentUser.id);
    }

    fetch(`/api/offers?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.offers) setOffers(d.offers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterStatus, filterProduct, onlyMine, currentUser]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers, refreshNonce]);

  useSupabaseRealtime(['Offer'], fetchOffers);

  useEffect(() => {
    if (currentUser?.role !== 'PRODUCTEUR') {
      setOnlyMine(false);
    }
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    if (currentUser?.role === 'PRODUCTEUR') {
      setProducerId(currentUser.id);
      const isValidProducerLoc = PRODUCER_LOCATIONS_LIST.some(
        (loc) => loc.name === currentUser.location
      );
      setLocation(
        isValidProducerLoc ? currentUser.location : PRODUCER_LOCATIONS_LIST[0].name
      );
    } else if (!producerId && producers.length > 0) {
      setProducerId(producers[0].id);
    }
  }, [currentUser, producers, producerId]);

  const canManageOffer = (offerProducerId: string) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMINISTRATEUR' || currentUser.id === offerProducerId;
  };

  const handleOpenNew = useCallback(() => {
    setEditingOffer(null);
    setProduct(PRODUCTS_LIST[0]);
    setQuantityValue(2000);
    setQuantityUnit('KG');
    setPricePerKg(380);
    const validProducerLoc = PRODUCER_LOCATIONS_LIST.some(
      (loc) => loc.name === currentUser?.location
    )
      ? currentUser!.location
      : PRODUCER_LOCATIONS_LIST[0].name;
    setLocation(
      currentUser?.role === 'PRODUCTEUR' ? validProducerLoc : PRODUCER_LOCATIONS_LIST[0].name
    );
    setAvailableDate(new Date().toISOString().split('T')[0]);
    setQuality(QUALITY_OPTIONS[0]);
    setStatus('DISPONIBLE');
    setImageUrl('');
    setShowForm(true);
  }, [currentUser?.location, currentUser?.role]);

  useEffect(() => {
    if (pendingFormAction === 'NEW_OFFER' && canCreateOffer && isExplicitlyAuthenticated) {
      handleOpenNew();
      setPendingFormAction(null);
    }
  }, [pendingFormAction, canCreateOffer, isExplicitlyAuthenticated, handleOpenNew, setPendingFormAction]);

  const prevResetNonce = useRef(sectionResetNonce);
  useEffect(() => {
    if (sectionResetNonce !== prevResetNonce.current) {
      prevResetNonce.current = sectionResetNonce;
      setShowForm(false);
      setEditingOffer(null);
    }
  }, [sectionResetNonce]);

  const handleOpenEdit = (offer: any) => {
    setEditingOffer(offer);
    setProducerId(offer.producerId);
    setProduct(offer.product);
    setQuantityValue(offer.quantityValue);
    setQuantityUnit(offer.quantityUnit);
    setPricePerKg(offer.pricePerKg);
    setLocation(offer.location);
    setAvailableDate(new Date(offer.availableDate).toISOString().split('T')[0]);
    setQuality(offer.quality);
    setStatus(offer.status);
    setImageUrl(offer.imageUrl || '');
    setShowForm(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Échec du téléversement de la photo.');
      setImageUrl(data.url);
      notify('Photo du lot enregistrée sur Supabase Storage.', 'success');
    } catch (err: any) {
      notify(err.message || 'Erreur lors du téléversement.', 'error');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingOffer) {
        const res = await fetch(`/api/offers/${editingOffer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product,
            quantityValue: Number(quantityValue),
            quantityUnit,
            pricePerKg: Number(pricePerKg),
            location,
            availableDate,
            quality,
            status,
            imageUrl: imageUrl || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification.');
        notify('Offre de récolte modifiée avec succès.', 'success');
      } else {
        const res = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            producerId:
              currentUser?.role === 'PRODUCTEUR' ? currentUser.id : producerId,
            product,
            quantityValue: Number(quantityValue),
            quantityUnit,
            pricePerKg: Number(pricePerKg),
            location,
            availableDate,
            quality,
            status,
            imageUrl: imageUrl || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la publication.');
        notify('Offre publiée avec succès dans la liste des productions.', 'success');
      }
      setFilterStatus('');
      setFilterProduct('');
      setSearchQuery('');
      setShowForm(false);
      setEditingOffer(null);
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
        const res = await fetch(`/api/offers/${confirmAction.offer.id}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');
        notify('Offre de récolte supprimée.', 'success');
      } else if (confirmAction.type === 'STATUS' && confirmAction.nextStatus) {
        const res = await fetch(`/api/offers/${confirmAction.offer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: confirmAction.nextStatus }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de statut.');
        notify(
          `Statut de l’offre mis à jour : ${
            OFFER_STATUS_LABELS[confirmAction.nextStatus]?.label
          }.`,
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

  const displayedOffers = offers.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.product.toLowerCase().includes(q) ||
      o.location.toLowerCase().includes(q) ||
      (o.producer?.name && o.producer.name.toLowerCase().includes(q))
    );
  });

  const isProducerUser = currentUser?.role === 'PRODUCTEUR';
  const hasActiveFilters = Boolean(filterProduct || filterStatus || searchQuery.trim() || onlyMine);

  const handleResetFilters = () => {
    setFilterProduct('');
    setFilterStatus('');
    setSearchQuery('');
    setOnlyMine(false);
  };

  const handleTriggerNewOffer = () => {
    if (!isExplicitlyAuthenticated || !canCreateOffer) {
      startPublishOffer();
    } else {
      handleOpenNew();
    }
  };

  const normalizedConversionText = (() => {
    const val = Number(quantityValue);
    if (!Number.isFinite(val) || val <= 0) return '';
    return quantityUnit === 'TONNE'
      ? `Équivaut à ${(val * 1000).toLocaleString('fr-FR')} kg`
      : `Équivaut à ${(val / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} tonne(s)`;
  })();

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="max-w-2xl mx-auto py-2 space-y-4">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditingOffer(null);
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-emerald-300 shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour aux productions</span>
          </button>

          <div className="anim-hero-card bg-white/95 backdrop-blur-md rounded-[2rem] border border-emerald-950/[0.08] shadow-[0_24px_65px_-20px_rgba(20,55,35,0.13)] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0F3D2E] via-emerald-600 to-teal-500" />

            <div className="p-6 sm:p-9 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-emerald-950/[0.07]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#EEF9F2] border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4FAF6] border border-emerald-200/70 text-[11px] font-semibold text-emerald-800 mb-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse-dot" />
                      <span>Espace Producteur</span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#14231B] tracking-tight">
                      {editingOffer
                        ? 'Modifier la production'
                        : 'Publier une nouvelle offre de récolte'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
                      Renseignez la variété d’oignon, la quantité, le tarif et votre zone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingOffer(null);
                  }}
                  className="w-9 h-9 rounded-full bg-[#F5F9F6] hover:bg-emerald-50 border border-emerald-950/[0.08] text-[#5C6B63] hover:text-[#14231B] flex items-center justify-center transition-colors shrink-0"
                  title="Fermer"
                  aria-label="Fermer le formulaire"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-5">
                {currentUser?.role === 'ADMINISTRATEUR' && !editingOffer && (
                  <div>
                    <label className="block text-xs font-semibold text-[#2B3E33] mb-1.5">
                      Producteur *
                    </label>
                    <select
                      value={producerId}
                      onChange={(e) => setProducerId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    >
                      {producers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.location})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="offer-product"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Variété d’oignon *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-700/80">
                      <Leaf className="w-4 h-4" />
                    </span>
                    <select
                      id="offer-product"
                      value={product}
                      onChange={(e) => setProduct(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-medium text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
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
                      htmlFor="offer-qty"
                      className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                    >
                      Quantité *
                    </label>
                    <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-2">
                      <div className="relative flex-1 min-w-[140px]">
                        <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                          <Package className="w-4 h-4" />
                        </span>
                        <input
                          id="offer-qty"
                          type="number"
                          required
                          min={0.1}
                          step="any"
                          value={quantityValue}
                          onChange={(e) =>
                            setQuantityValue(e.target.value ? Number(e.target.value) : '')
                          }
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-semibold text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                        />
                      </div>

                      <div className="inline-flex p-1 rounded-xl bg-[#F2F7F4] border border-[#D5E0D8] shrink-0">
                        <button
                          type="button"
                          onClick={() => setQuantityUnit('KG')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            quantityUnit === 'KG'
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'text-[#5C6B63] hover:text-[#14231B]'
                          }`}
                        >
                          kg
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuantityUnit('TONNE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            quantityUnit === 'TONNE'
                              ? 'bg-emerald-700 text-white shadow-sm'
                              : 'text-[#5C6B63] hover:text-[#14231B]'
                          }`}
                        >
                          tonnes
                        </button>
                      </div>
                    </div>
                    {normalizedConversionText && (
                      <span className="inline-block text-[11px] font-medium text-emerald-800 bg-[#F2FAF5] border border-emerald-200/70 px-2.5 py-0.5 rounded-full mt-2">
                        {normalizedConversionText}
                      </span>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="offer-price"
                      className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                    >
                      Prix souhaité (FCFA / kg) *
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                        <Tag className="w-4 h-4" />
                      </span>
                      <input
                        id="offer-price"
                        type="number"
                        required
                        min={1}
                        value={pricePerKg}
                        onChange={(e) =>
                          setPricePerKg(e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full pl-10 pr-24 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm font-semibold text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-[11px] font-semibold text-[#5C6B63]">
                        FCFA / kg
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="offer-location"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Localisation *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <select
                      id="offer-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    >
                      {PRODUCER_LOCATIONS_LIST.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Photo facultative du lot (Supabase Storage) */}
                <div>
                  <label
                    htmlFor="offer-photo"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Photo de la récolte (facultative)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label
                      htmlFor="offer-photo"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-emerald-400/80 bg-[#F4FAF6] hover:bg-[#EBF6EF] text-xs font-semibold text-emerald-900 cursor-pointer transition-colors"
                    >
                      <ImagePlus className="w-4 h-4 text-emerald-700" />
                      <span>
                        {uploadingPhoto
                          ? 'Envoi vers Supabase Storage...'
                          : imageUrl
                          ? 'Changer la photo'
                          : 'Ajouter une photo du lot'}
                      </span>
                    </label>
                    <input
                      id="offer-photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      disabled={uploadingPhoto}
                      className="sr-only"
                    />
                    {imageUrl && (
                      <div className="flex items-center gap-2.5">
                        <img
                          src={imageUrl}
                          alt="Aperçu du lot d’oignons"
                          className="w-16 h-11 rounded-lg object-cover border border-emerald-200 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="text-xs font-medium text-red-700 hover:underline"
                        >
                          Retirer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingOffer && (
                  <div>
                    <label
                      htmlFor="offer-status"
                      className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                    >
                      Statut de l’offre
                    </label>
                    <select
                      id="offer-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as 'DISPONIBLE' | 'RESERVEE' | 'VENDUE')
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="RESERVEE">Réservée</option>
                      <option value="VENDUE">Vendue</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-emerald-950/[0.07]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingOffer(null);
                    }}
                    className="px-5 py-3 rounded-xl border border-[#D5E0D8] bg-white hover:bg-[#F4F8F5] text-sm font-medium text-[#344A3D] transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || uploadingPhoto}
                    className="group anim-card-shine inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F3D2E] to-emerald-700 hover:from-[#134E3A] hover:to-emerald-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all"
                  >
                    <span>
                      {saving
                        ? 'Enregistrement...'
                        : editingOffer
                        ? 'Mettre à jour'
                        : 'Publier l’offre'}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-950/10 text-xs font-semibold text-[#344A3D] hover:text-[#14231B] hover:border-emerald-300 shadow-sm transition-all"
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

          {/* En-tête épuré Espace Producteurs (Productions uniquement) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#F2FAF5] via-white to-[#F7FBF8] border border-emerald-200/70 p-6 sm:p-8 shadow-[0_14px_40px_-20px_rgba(15,61,46,0.14)]">
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200/80 text-[11px] font-semibold text-[#0F3D2E] shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 anim-pulse-dot" />
                    <span>
                      {isProducerUser && currentUser?.name
                        ? `Espace Producteur · ${currentUser.name}`
                        : 'Espace Producteurs'}
                    </span>
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#EEF9F2] border border-emerald-200/70 text-[11px] font-semibold text-emerald-900">
                    {displayedOffers.length}{' '}
                    {displayedOffers.length > 1 ? 'productions publiées' : 'production publiée'}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0E241B] tracking-tight">
                  Offres de{' '}
                  <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                    production
                  </span>
                </h1>
                <p className="text-sm text-[#55665D] max-w-xl leading-relaxed">
                  Consultez les récoltes d’oignons proposées par les producteurs ou publiez votre
                  propre lot bord champ.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerNewOffer}
                className="group anim-card-shine w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-[#0F5D30] to-emerald-700 hover:from-[#0B4724] hover:to-emerald-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Publier une offre</span>
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
                  placeholder="Rechercher une production par variété, producteur ou zone..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-[#D8E2DC] bg-[#FAFBF9] text-sm text-[#14231B] placeholder:text-[#8E9D95] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
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
                <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-emerald-700/75">
                  <Leaf className="w-4 h-4" />
                </span>
                <select
                  value={filterProduct}
                  onChange={(e) => setFilterProduct(e.target.value)}
                  aria-label="Filtrer par variété d’oignon"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#D8E2DC] bg-[#FAFBF9] text-sm font-medium text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
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
                    { value: '', label: 'Tous' },
                    { value: 'DISPONIBLE', label: 'Disponibles' },
                    { value: 'RESERVEE', label: 'Réservées' },
                    { value: 'VENDUE', label: 'Vendues' },
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
                {isProducerUser && (
                  <button
                    type="button"
                    onClick={() => setOnlyMine(!onlyMine)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                      onlyMine
                        ? 'bg-[#0F5D30] text-white border-[#0F5D30] shadow-sm'
                        : 'bg-[#FAFBF9] text-[#344A3D] border-[#D8E2DC] hover:bg-emerald-50/70 hover:border-emerald-300'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        onlyMine ? 'bg-emerald-200' : 'bg-[#9AA8A0]'
                      }`}
                    />
                    <span>Mes offres uniquement</span>
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

          {/* Grille moderne et aérée des productions */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[0, 1, 2].map((skeletonIdx) => (
                <div
                  key={skeletonIdx}
                  className="h-56 w-full rounded-3xl bg-white border border-emerald-950/[0.06] p-5 anim-skeleton"
                />
              ))}
            </div>
          ) : displayedOffers.length === 0 ? (
            <div className="bg-white rounded-3xl border border-emerald-950/[0.08] px-6 py-14 text-center shadow-sm">
              <div className="max-w-md mx-auto space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EEF9F2] to-[#F7FBF8] border border-emerald-200/80 text-emerald-700 mx-auto flex items-center justify-center shadow-sm">
                  <Leaf className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold text-[#14231B]">
                    {onlyMine
                      ? 'Vous n’avez pas encore publié d’offre'
                      : 'Aucune production enregistrée'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C6B63] leading-relaxed">
                    Publiez une nouvelle offre de récolte d’oignons pour la rendre immédiatement
                    visible aux acheteurs.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerNewOffer}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0F5D30] hover:bg-[#0B4724] shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publier une offre</span>
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
              {displayedOffers.map((offer) => {
                const st =
                  OFFER_STATUS_LABELS[offer.status] || OFFER_STATUS_LABELS.DISPONIBLE;
                const isOwnerOrAdmin = canManageOffer(offer.producerId);

                return (
                  <article
                    key={offer.id}
                    className="group bg-white rounded-3xl border border-emerald-950/[0.08] hover:border-emerald-300/80 shadow-[0_10px_30px_-18px_rgba(15,61,46,0.12)] hover:shadow-[0_18px_40px_-16px_rgba(15,61,46,0.18)] transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {offer.imageUrl && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-[#F2FAF5] border-b border-emerald-950/[0.06]">
                          <img
                            src={offer.imageUrl}
                            alt={`Production ${offer.product}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      )}

                      <div className="p-5 sm:p-6 space-y-4">
                        {/* En-tête de carte : Variété + Statut */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-[#EEF9F2] border border-emerald-200/70 text-[#0F5D30] flex items-center justify-center shrink-0">
                              <Leaf className="w-4 h-4" />
                            </div>
                            <h3 className="font-display text-base font-bold text-[#0E241B] leading-snug truncate">
                              {offer.product}
                            </h3>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${st.badgeClass}`}
                          >
                            {st.label}
                          </span>
                        </div>

                        {/* Métriques principales : Quantité & Prix souhaité */}
                        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F6FBF8] border border-emerald-200/60">
                          <div>
                            <span className="text-[11px] font-medium text-[#5C6E64] block">
                              Quantité
                            </span>
                            <span className="font-display text-base font-bold text-[#0E241B] block mt-0.5">
                              {offer.quantityValue}{' '}
                              {offer.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}
                            </span>
                            {offer.quantityUnit === 'TONNE' && (
                              <span className="text-[11px] text-[#6E7D75]">
                                ({offer.quantityKg.toLocaleString('fr-FR')} kg)
                              </span>
                            )}
                          </div>
                          <div className="border-l border-emerald-200/60 pl-3">
                            <span className="text-[11px] font-medium text-[#5C6E64] block">
                              Prix souhaité
                            </span>
                            <span className="font-display text-base font-bold text-[#0F5D30] block mt-0.5">
                              {offer.pricePerKg} FCFA
                            </span>
                            <span className="text-[11px] text-[#5C6E64]">par kg</span>
                          </div>
                        </div>

                        {/* Infos Producteur, Zone & Contact direct */}
                        <div className="space-y-2 text-xs text-[#43564C]">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="font-semibold text-[#14231B] truncate">
                              {offer.producer?.name || 'Producteur'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{offer.location}</span>
                          </div>
                          {offer.producer?.phone && (
                            <div className="pt-1">
                              <a
                                href={`tel:${offer.producer.phone.replace(/\s+/g, '')}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4FAF6] hover:bg-emerald-100/70 border border-emerald-200/70 text-xs font-semibold text-[#0F5D30] transition-colors"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span>{offer.producer.phone}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions du propriétaire / administrateur */}
                    {isOwnerOrAdmin && (
                      <div className="px-5 sm:px-6 py-3.5 bg-[#FAFBF9] border-t border-emerald-950/[0.06] flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(offer)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#344A3D] bg-white hover:bg-emerald-50 border border-[#D8E2DC] rounded-xl transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>

                          {offer.status === 'DISPONIBLE' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'STATUS',
                                  offer,
                                  nextStatus: 'RESERVEE',
                                })
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                            >
                              Réserver
                            </button>
                          )}

                          {offer.status === 'RESERVEE' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'STATUS',
                                  offer,
                                  nextStatus: 'DISPONIBLE',
                                })
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-[#344A3D] bg-white hover:bg-[#F4F7F5] border border-[#D8E2DC] rounded-xl transition-colors"
                            >
                              Libérer
                            </button>
                          )}

                          {offer.status !== 'VENDUE' && (
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  type: 'STATUS',
                                  offer,
                                  nextStatus: 'VENDUE',
                                })
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors"
                            >
                              Vendue
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'DELETE', offer })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          title="Supprimer cette offre"
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
            ? 'Confirmer la suppression de l’offre'
            : 'Confirmer le changement de statut'
        }
        description={
          confirmAction?.type === 'DELETE' ? (
            <>
              Voulez-vous supprimer définitivement l’offre de{' '}
              <strong className="text-slate-900">{confirmAction.offer.product}</strong> (
              {confirmAction.offer.quantityValue}{' '}
              {confirmAction.offer.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'}) ?
            </>
          ) : confirmAction?.nextStatus ? (
            <>
              Passer le statut de l’offre{' '}
              <strong className="text-slate-900">{confirmAction.offer.product}</strong> à{' '}
              <strong className="text-slate-900">
                {OFFER_STATUS_LABELS[confirmAction.nextStatus]?.label}
              </strong>{' '}
              ?
            </>
          ) : null
        }
        confirmLabel={
          confirmAction?.type === 'DELETE' ? 'Supprimer' : 'Confirmer'
        }
        variant={confirmAction?.type === 'DELETE' ? 'danger' : 'primary'}
        loading={actionLoading}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};
