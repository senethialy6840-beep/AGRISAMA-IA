'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import {
  BUYER_LOCATIONS_LIST,
  DEMAND_STATUS_LABELS,
  OFFER_STATUS_LABELS,
  PRODUCER_LOCATIONS_LIST,
} from '@/lib/constants';
import {
  UserPlus,
  Edit3,
  Eye,
  Phone,
  MapPin,
  Building2,
  Package,
  ShoppingBag,
  X,
  Search,
  ArrowLeft,
  LogOut,
} from 'lucide-react';

interface ActorDirectoryProps {
  role: 'PRODUCTEUR' | 'ACHETEUR';
}

export const ActorDirectory: React.FC<ActorDirectoryProps> = ({ role }) => {
  const { currentUser, refreshUsers, notify, setActiveSection, logout } = useApp();
  const isProducer = role === 'PRODUCTEUR';

  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedActor, setSelectedActor] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActor, setEditingActor] = useState<any | null>(null);

  const availableLocations = isProducer ? PRODUCER_LOCATIONS_LIST : BUYER_LOCATIONS_LIST;
  const defaultLocation = availableLocations[0].name;
  const defaultPhonePrefix = isProducer ? '+221 77 ' : '+221 78 ';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState(defaultPhonePrefix);
  const [location, setLocation] = useState(defaultLocation);
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchActors = useCallback(() => {
    setLoading(true);
    fetch(`/api/users?role=${role}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.users) {
          setActors(d.users);
          setSelectedActor((prev: any) => {
            if (prev) {
              const updated = d.users.find((u: any) => u.id === prev.id);
              if (updated) return updated;
            }
            if (currentUser?.role === role) {
              const mine = d.users.find((u: any) => u.id === currentUser.id);
              if (mine) return mine;
            }
            return d.users.length > 0 ? d.users[0] : null;
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role, currentUser]);

  useEffect(() => {
    fetchActors();
  }, [fetchActors]);

  const canEdit = (actorId: string) => {
    if (!currentUser) return false;
    return currentUser.role === 'ADMINISTRATEUR' || currentUser.id === actorId;
  };

  const handleOpenAdd = () => {
    setEditingActor(null);
    setName('');
    setPhone(defaultPhonePrefix);
    setLocation(defaultLocation);
    setOrganization('');
    setShowAddForm(true);
  };

  const handleOpenEdit = (actor: any) => {
    setShowAddForm(false);
    setEditingActor(actor);
    setName(actor.name);
    setPhone(actor.phone);
    setLocation(actor.location);
    setOrganization(actor.organization || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingActor) {
        const res = await fetch(`/api/users/${editingActor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            location,
            organization,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de la modification.');
        notify(
          isProducer
            ? 'Informations du producteur mises à jour.'
            : 'Informations de l’acheteur mises à jour.',
          'success'
        );
        setEditingActor(null);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            name,
            phone,
            location,
            organization,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur lors de l’ajout.');
        notify(
          isProducer
            ? 'Producteur enregistré avec succès.'
            : 'Acheteur enregistré avec succès.',
          'success'
        );
        setShowAddForm(false);
      }
      await refreshUsers();
      fetchActors();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filteredActors = actors.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      (a.organization && a.organization.toLowerCase().includes(q))
    );
  });

  const myProfile =
    currentUser?.role === role
      ? actors.find((a) => a.id === currentUser.id)
      : null;

  const itemsKey = isProducer ? 'offers' : 'demands';

  return (
    <div className="space-y-6">
      {/* Barre de retour cohérente & déconnexion */}
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

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-emerald-950/[0.08] pb-5">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#14231B]">
            {isProducer ? 'Producteurs' : 'Acheteurs'}
          </h1>
          <p className="text-sm text-[#5C6B63] mt-1">
            {isProducer
              ? 'Consultation des producteurs enregistrés, de leurs coordonnées et de leurs offres de récolte.'
              : 'Consultation des acheteurs enregistrés, de leurs coordonnées et de leurs demandes d’achat.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {myProfile && (
            <button
              type="button"
              onClick={() => handleOpenEdit(myProfile)}
              className="saas-btn-secondary"
            >
              <Edit3 className="w-4 h-4 text-emerald-700" />
              <span>Modifier mon profil</span>
            </button>
          )}

          {currentUser?.role === 'ADMINISTRATEUR' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="saas-btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isProducer ? 'Ajouter un producteur' : 'Ajouter un acheteur'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout ou de modification */}
      {(showAddForm || editingActor) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              {editingActor
                ? `Modifier le profil ${isProducer ? 'producteur' : 'acheteur'} : ${editingActor.name}`
                : isProducer
                ? 'Ajouter un nouveau producteur'
                : 'Ajouter un nouvel acheteur'}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingActor(null);
              }}
              className="text-slate-400 hover:text-slate-700"
              aria-label="Fermer le formulaire"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nom complet *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isProducer ? 'Ex : Moussa Diouf' : 'Ex : Abdoulaye Ndiaye'}
                className="saas-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Téléphone *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={isProducer ? '+221 77 000 00 00' : '+221 78 000 00 00'}
                className="saas-input"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isProducer ? 'Localisation *' : 'Localisation principale *'}
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="saas-select"
              >
                {availableLocations.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {isProducer
                  ? 'Exploitation ou coopérative (facultatif)'
                  : 'Société ou marché d’activité (facultatif)'}
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={
                  isProducer
                    ? 'Ex : Union Maraîchère de Notto'
                    : 'Ex : Grossiste Marché Thiaroye'
                }
                className="saas-input"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingActor(null);
                }}
                className="saas-btn-secondary w-full sm:w-auto justify-center"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="saas-btn-primary w-full sm:w-auto justify-center"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barre de recherche rapide */}
      <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isProducer
              ? 'Rechercher un producteur par nom, localité, téléphone ou coopérative...'
              : 'Rechercher un acheteur par nom, marché, téléphone ou société...'
          }
          className="w-full text-sm text-slate-900 focus:outline-none bg-transparent"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-700"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Liste + Panneau de détail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
          {loading ? (
            <div className="p-8 text-sm text-slate-500 text-center">
              Chargement {isProducer ? 'des producteurs' : 'des acheteurs'}...
            </div>
          ) : filteredActors.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-800">
                {isProducer ? 'Aucun producteur trouvé' : 'Aucun acheteur trouvé'}
              </p>
              <p className="text-xs text-slate-500">
                Modifiez votre recherche pour afficher les profils enregistrés.
              </p>
            </div>
          ) : (
            <>
              {/* Vue cartes mobiles (< md) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredActors.map((actor) => {
                  const count = actor[itemsKey]?.length || 0;
                  const isSelected = selectedActor?.id === actor.id;
                  return (
                    <div
                      key={actor.id}
                      className={`p-4 space-y-2.5 ${isSelected ? 'bg-emerald-50/40' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-sm text-slate-900 flex items-center gap-2 flex-wrap">
                            <span>{actor.name}</span>
                            {currentUser?.id === actor.id && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                Mon profil
                              </span>
                            )}
                          </div>
                          {actor.organization && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {actor.organization}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                          {count} {isProducer ? 'offre(s)' : 'demande(s)'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {actor.location}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {actor.phone}
                        </span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSelectedActor(actor)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Consulter</span>
                        </button>
                        {canEdit(actor.id) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(actor)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Modifier</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Vue tableau desktop (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                      <th className="py-3 px-4">
                        {isProducer ? 'Producteur' : 'Acheteur'}
                      </th>
                      <th className="py-3 px-4">Localisation</th>
                      <th className="py-3 px-4">Téléphone</th>
                      <th className="py-3 px-4">
                        {isProducer ? 'Offres' : 'Demandes'}
                      </th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredActors.map((actor) => {
                      const count = actor[itemsKey]?.length || 0;
                      return (
                        <tr
                          key={actor.id}
                          className={`hover:bg-slate-50 ${
                            selectedActor?.id === actor.id ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-slate-900">
                              {actor.name}
                              {currentUser?.id === actor.id && (
                                <span className="ml-2 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Mon profil
                                </span>
                              )}
                            </div>
                            {actor.organization && (
                              <div className="text-xs text-slate-500">
                                {actor.organization}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {actor.location}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                            {actor.phone}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              {count} {isProducer ? 'offre(s)' : 'demande(s)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedActor(actor)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Consulter</span>
                            </button>
                            {canEdit(actor.id) && (
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(actor)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Modifier</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Fiche détaillée */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit space-y-5">
          {selectedActor ? (
            <>
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {isProducer ? 'Informations du producteur' : 'Informations de l’acheteur'}
                  </span>
                  {canEdit(selectedActor.id) && (
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(selectedActor)}
                      className="text-xs font-medium text-emerald-700 hover:underline"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">
                  {selectedActor.name}
                </h3>
                <div className="space-y-1.5 mt-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{selectedActor.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <a
                      href={`tel:${selectedActor.phone.replace(/\s+/g, '')}`}
                      className="text-emerald-700 hover:underline font-mono text-xs"
                    >
                      {selectedActor.phone}
                    </a>
                  </div>
                  {selectedActor.organization && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{selectedActor.organization}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                    {isProducer ? (
                      <Package className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <ShoppingBag className="w-4 h-4 text-amber-700" />
                    )}
                    <span>
                      {isProducer ? 'Offres de récolte' : 'Demandes d’achat'} (
                      {selectedActor[itemsKey]?.length || 0})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveSection(isProducer ? 'OFFRES' : 'DEMANDES')}
                    className="text-xs font-medium text-emerald-700 hover:underline"
                  >
                    {isProducer ? 'Voir toutes les offres' : 'Voir toutes les demandes'}
                  </button>
                </div>

                {!selectedActor[itemsKey] || selectedActor[itemsKey].length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">
                    {isProducer
                      ? 'Ce producteur n’a publié aucune offre pour le moment.'
                      : 'Cet acheteur n’a publié aucune demande d’achat pour le moment.'}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedActor[itemsKey].map((item: any) => {
                      const statusMap = isProducer
                        ? OFFER_STATUS_LABELS
                        : DEMAND_STATUS_LABELS;
                      const st =
                        statusMap[item.status] ||
                        (isProducer
                          ? OFFER_STATUS_LABELS.DISPONIBLE
                          : DEMAND_STATUS_LABELS.ACTIVE);

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {item.product}
                            </span>
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${st.badgeClass}`}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-600">
                            {item.quantityValue}{' '}
                            {item.quantityUnit === 'TONNE' ? 'tonnes' : 'kg'} •{' '}
                            {isProducer
                              ? `Prix : ${item.pricePerKg} FCFA/kg`
                              : `Max : ${item.maxPricePerKg} FCFA/kg`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              {isProducer
                ? 'Sélectionnez un producteur dans la liste pour consulter ses informations détaillées et ses offres de récolte.'
                : 'Sélectionnez un acheteur dans la liste pour consulter ses informations et ses demandes d’achat.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
