'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  BUYER_LOCATIONS_LIST,
  LOCATIONS_LIST,
  PRODUCER_LOCATIONS_LIST,
  ROLE_LABELS,
} from '@/lib/constants';
import { X, Check } from 'lucide-react';

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onClose }) => {
  const { currentUser, refreshSession, notify } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(LOCATIONS_LIST[0].name);
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser && open) {
      setName(currentUser.name);
      setPhone(currentUser.phone);
      setLocation(currentUser.location);
      setOrganization(currentUser.organization || '');
    }
  }, [currentUser, open]);

  if (!open || !currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
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
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la mise à jour.');
      }
      await refreshSession();
      notify('Votre profil a été mis à jour.', 'success');
      onClose();
    } catch (err: any) {
      notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#14231B]/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 border border-emerald-950/[0.08] shadow-xl space-y-5 anim-modal-spring">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Mon profil</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rôle : {ROLE_LABELS[currentUser.role] || currentUser.role}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="saas-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Numéro de téléphone *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="saas-input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Localisation *
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="saas-select"
            >
              {(currentUser.role === 'PRODUCTEUR'
                ? PRODUCER_LOCATIONS_LIST
                : currentUser.role === 'ACHETEUR'
                ? BUYER_LOCATIONS_LIST
                : LOCATIONS_LIST
              ).map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {currentUser.role === 'PRODUCTEUR'
                ? 'Exploitation ou coopérative (facultatif)'
                : 'Société ou marché (facultatif)'}
            </label>
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="saas-input"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="saas-btn-secondary w-full sm:w-auto justify-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="saas-btn-primary w-full sm:w-auto justify-center"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
