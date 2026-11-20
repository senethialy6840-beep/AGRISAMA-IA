'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BUYER_LOCATIONS_LIST, PRODUCER_LOCATIONS_LIST } from '@/lib/constants';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  MapPin,
  Phone,
  ShoppingBag,
  User,
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const {
    setActiveSection,
    pendingFormAction,
    setPendingFormAction,
    quickConnect,
  } = useApp();

  const isOfferFlow = pendingFormAction === 'NEW_OFFER';
  const isDemandFlow = pendingFormAction === 'NEW_DEMAND';
  const isRoleLocked = isOfferFlow || isDemandFlow;

  const [role, setRole] = useState<'PRODUCTEUR' | 'ACHETEUR'>(
    isDemandFlow ? 'ACHETEUR' : 'PRODUCTEUR'
  );
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(
    isDemandFlow ? BUYER_LOCATIONS_LIST[0].name : PRODUCER_LOCATIONS_LIST[0].name
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (pendingFormAction === 'NEW_OFFER') {
      setRole('PRODUCTEUR');
      setLocation(PRODUCER_LOCATIONS_LIST[0].name);
    } else if (pendingFormAction === 'NEW_DEMAND') {
      setRole('ACHETEUR');
      setLocation(BUYER_LOCATIONS_LIST[0].name);
    }
  }, [pendingFormAction]);

  const isProducer = role === 'PRODUCTEUR';
  const availableLocations = isProducer ? PRODUCER_LOCATIONS_LIST : BUYER_LOCATIONS_LIST;

  const handleSelectRole = (nextRole: 'PRODUCTEUR' | 'ACHETEUR') => {
    if (isRoleLocked) return;
    setRole(nextRole);
    setErrorMsg('');
    setLocation(
      nextRole === 'PRODUCTEUR'
        ? PRODUCER_LOCATIONS_LIST[0].name
        : BUYER_LOCATIONS_LIST[0].name
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);
    try {
      await quickConnect({
        role,
        name,
        phone,
        location,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-br from-[#F2F8F4] via-[#FAFBF9] to-[#FDF8EE] flex flex-col justify-between py-5 sm:py-8 px-3.5 sm:px-6 lg:px-8">
      {/* Motif et halos pastel animés en arrière-plan */}
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
        className="pointer-events-none absolute -bottom-24 -right-20 w-96 h-96 rounded-full bg-amber-200/30 blur-3xl anim-halo-reverse"
      />

      {/* Barre supérieure épurée */}
      <div className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            setPendingFormAction(null);
            setActiveSection('ACCUEIL');
          }}
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

      {/* Carte principale redesignée avec visuel terrain contextuel */}
      <div className="relative z-10 max-w-4xl w-full mx-auto my-8">
        <div className="anim-hero-card bg-white/95 backdrop-blur-md rounded-[2rem] border border-emerald-950/[0.08] shadow-[0_24px_65px_-20px_rgba(20,55,35,0.14)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Panneau photographique contextuel au ratio exact 3:2 sans recadrage */}
          <div
            className={`lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between gap-5 border-b lg:border-b-0 lg:border-r ${isProducer
              ? 'bg-gradient-to-br from-[#EDF8F1] via-[#F6FBF8] to-[#FFFFFF] border-emerald-200/60'
              : 'bg-gradient-to-br from-[#FEF6E8] via-[#FFFBF3] to-[#FFFFFF] border-amber-200/60'
              }`}
          >
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-emerald-950/[0.08] text-[11px] font-semibold text-[#14231B] shadow-sm">
                <span
                  className={`w-2 h-2 rounded-full ${isProducer ? 'bg-emerald-500 anim-pulse-dot' : 'bg-amber-500 anim-pulse-amber'
                    }`}
                />
                <span>
                  {isProducer ? 'Producteur · Bassins d’oignons' : 'Acheteur · Marchés locaux'}
                </span>
              </span>
            </div>

            <div className="relative aspect-[3/2] w-full rounded-2xl overflow-hidden border border-white shadow-md bg-emerald-950/5">
              <img
                src={isProducer ? '/images/producteur-terrain.jpg' : '/images/stockage-oignons.jpg'}
                alt={
                  isProducer
                    ? 'Producteur agricole consultant AgriSama IA sur smartphone en parcelle'
                    : 'Entrepôt d’oignons locaux prêts pour les acheteurs et grossistes'
                }
                className={`w-full h-full object-cover transition-all duration-700 ${isProducer ? 'object-top' : 'object-center'
                  }`}
              />
            </div>

            <div className="space-y-2">
              <p className="font-display text-lg sm:text-xl font-bold text-[#14231B] leading-snug">
                {isProducer
                  ? 'Vendez vos récoltes directement bord champ'
                  : 'Sécurisez vos lots d’oignons locaux'}
              </p>
              <p className="text-xs text-[#516259] leading-relaxed">
                {isProducer
                  ? 'Publiez vos volumes d’oignons en quelques secondes et consultez immédiatement les demandes des acheteurs.'
                  : 'Déposez votre besoin d’approvisionnement et accédez aux lots d’oignons des Niayes et de la Vallée.'}
              </p>
            </div>
          </div>

          {/* Colonne formulaire */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Liseré supérieur dégradé selon le profil */}
            <div
              className={`h-1.5 w-full bg-gradient-to-r ${isProducer
                ? 'from-emerald-500 via-teal-500 to-emerald-600'
                : 'from-amber-500 via-orange-400 to-amber-600'
                }`}
            />

            <div className="p-6 sm:p-9 space-y-6 flex-1 flex flex-col justify-center">
              {/* En-tête doux avec icône */}
              <div className="text-center lg:text-left space-y-2">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border transition-all duration-300 shrink-0 ${isProducer
                      ? 'bg-[#EEF9F2] border-emerald-200/80 text-emerald-700'
                      : 'bg-[#FEF7EB] border-amber-200/80 text-amber-700'
                      }`}
                  >
                    {isProducer ? (
                      <Leaf className="w-5 h-5" />
                    ) : (
                      <ShoppingBag className="w-5 h-5" />
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F9F6] border border-emerald-950/[0.07] text-[11px] font-semibold text-[#3C5447]">
                    <span
                      className={`w-2 h-2 rounded-full ${isProducer ? 'bg-emerald-500 anim-pulse-dot' : 'bg-amber-500 anim-pulse-amber'
                        }`}
                    />
                    <span>
                      {isOfferFlow
                        ? 'Espace Producteur d’oignons'
                        : isDemandFlow
                          ? 'Espace Acheteur & Grossiste'
                          : 'Connexion directe AgriSama IA'}
                    </span>
                  </div>
                </div>

                <h1 className="font-display text-2xl sm:text-[1.75rem] font-bold text-[#0E241B] tracking-tight pt-1">
                  {isOfferFlow ? (
                    <>
                      Identifiez-vous pour{' '}
                      <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                        publier
                      </span>
                    </>
                  ) : isDemandFlow ? (
                    <>
                      Identifiez-vous pour{' '}
                      <span className="font-editorial italic font-semibold text-[#B45309]">
                        commander
                      </span>
                    </>
                  ) : (
                    <>
                      Accédez à{' '}
                      <span className="font-editorial italic font-semibold text-[#0F3D2E]">
                        votre espace
                      </span>
                    </>
                  )}
                </h1>

                <p className="text-xs sm:text-sm text-[#5C6B63] leading-relaxed">
                  {isOfferFlow
                    ? 'Renseignez votre nom, votre téléphone et votre localisation avant de publier votre offre de récolte.'
                    : isDemandFlow
                      ? 'Renseignez votre nom, votre téléphone et votre localisation avant de déposer votre demande d’achat.'
                      : 'Indiquez simplement votre nom complet, votre téléphone et votre localisation.'}
                </p>
              </div>

              {/* Sélecteur de profil (affiché uniquement lors d'une connexion libre) */}
              {!isRoleLocked && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectRole('PRODUCTEUR')}
                    className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 ${isProducer
                      ? 'bg-[#F2FAF5] border-emerald-500 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:border-emerald-300 hover:bg-[#FAFDFB]'
                      }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${isProducer
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                        }`}
                    >
                      <Leaf className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#14231B]">Producteur</span>
                      <span className="block text-[11px] text-[#5C6B63] truncate">
                        Publier mes récoltes
                      </span>
                    </div>
                    {isProducer && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRole('ACHETEUR')}
                    className={`group relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center gap-3 ${!isProducer
                      ? 'bg-[#FEF9F0] border-amber-500 shadow-sm'
                      : 'bg-white border-emerald-950/10 hover:border-amber-300 hover:bg-[#FFFDF9]'
                      }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${!isProducer
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700'
                        }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-[#14231B]">Acheteur</span>
                      <span className="block text-[11px] text-[#5C6B63] truncate">
                        Acheter des oignons
                      </span>
                    </div>
                    {!isProducer && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 rounded-2xl bg-red-50/90 border border-red-200 text-xs font-medium text-red-800 anim-section-in">
                  {errorMsg}
                </div>
              )}

              {/* Formulaire épuré à 3 champs : Nom complet, Téléphone, Localisation */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champ 1 : Nom complet */}
                <div>
                  <label
                    htmlFor="auth-fullname"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Nom complet *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="auth-fullname"
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isProducer ? 'Ex : Modou Ndiaye' : 'Ex : Aïssatou Fall'}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] placeholder:text-[#9AA8A0] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    />
                  </div>
                </div>

                {/* Champ 2 : Téléphone */}
                <div>
                  <label
                    htmlFor="auth-phone"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Téléphone *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="auth-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex : +221 77 110 22 33"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] placeholder:text-[#9AA8A0] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    />
                  </div>
                </div>

                {/* Champ 3 : Localisation */}
                <div>
                  <label
                    htmlFor="auth-location"
                    className="block text-xs font-semibold text-[#2B3E33] mb-1.5"
                  >
                    Localisation *
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#7A8C82]">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <select
                      id="auth-location"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#D5E0D8] bg-[#FCFDFC] text-sm text-[#14231B] focus:outline-none focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 transition-all"
                    >
                      {availableLocations.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bouton de validation principal */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`group anim-card-shine w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-full text-sm font-semibold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 transition-all ${isProducer
                      ? 'bg-gradient-to-r from-[#0F3D2E] to-emerald-700 hover:from-[#134E3A] hover:to-emerald-800'
                      : 'bg-gradient-to-r from-[#B45309] to-amber-600 hover:from-[#92400E] hover:to-amber-700'
                      }`}
                  >
                    <span>
                      {submitting
                        ? 'Connexion en cours...'
                        : isOfferFlow
                          ? 'Se connecter et publier mon offre'
                          : isDemandFlow
                            ? 'Se connecter et déposer ma demande'
                            : 'Se connecter'}
                    </span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Pied discret */}
      <div className="relative z-10 text-center text-xs text-[#6E7D75]">
        AgriSama IA · Filière Oignon des Niayes, Sénégal
      </div>
    </div>
  );
};
