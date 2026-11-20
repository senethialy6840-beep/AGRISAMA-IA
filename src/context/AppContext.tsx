'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type SectionName =
  | 'ACCUEIL'
  | 'CONNEXION'
  | 'TABLEAU_DE_BORD'
  | 'PRODUCTEURS'
  | 'OFFRES'
  | 'ACHETEURS'
  | 'DEMANDES'
  | 'MISE_EN_RELATION';

export type PendingFormAction = 'NEW_OFFER' | 'NEW_DEMAND' | null;

export interface UserProfile {
  id: string;
  role: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
  organization?: string | null;
}

export interface MatchFocus {
  offerId?: string;
  demandId?: string;
  label?: string;
}

export interface RegisterPayload {
  role: 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
  organization?: string;
  password: string;
}

export interface QuickConnectPayload {
  role: 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  authLoading: boolean;
  demoUsers: UserProfile[];
  allUsers: UserProfile[];
  refreshUsers: () => Promise<void>;
  refreshSession: () => Promise<void>;
  activeSection: SectionName;
  setActiveSection: (section: SectionName) => void;
  pendingFormAction: PendingFormAction;
  setPendingFormAction: (action: PendingFormAction) => void;
  isExplicitlyAuthenticated: boolean;
  startPublishOffer: () => void;
  startDepositDemand: () => void;
  sectionResetNonce: number;
  triggerSectionReset: () => void;
  authInitialMode: 'LOGIN' | 'REGISTER';
  openAuth: (mode?: 'LOGIN' | 'REGISTER') => void;
  matchFocus: MatchFocus | null;
  setMatchFocus: (focus: MatchFocus | null) => void;
  openMatchingFor: (focus: MatchFocus) => void;
  login: (phone: string, password: string) => Promise<void>;
  loginAdmin: (identifier: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  quickConnect: (payload: QuickConnectPayload) => Promise<void>;
  loginDemo: (
    target: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR' | { userId: string },
    targetSection?: SectionName
  ) => Promise<void>;
  logout: () => Promise<void>;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

function getDefaultSectionForRole(
  role?: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR' | null
): SectionName {
  if (role === 'ADMINISTRATEUR') return 'TABLEAU_DE_BORD';
  if (role === 'PRODUCTEUR') return 'OFFRES';
  if (role === 'ACHETEUR') return 'DEMANDES';
  return 'ACCUEIL';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [activeSection, setActiveSectionState] = useState<SectionName>('ACCUEIL');
  const [pendingFormAction, setPendingFormAction] = useState<PendingFormAction>(null);
  const [isExplicitlyAuthenticated, setIsExplicitlyAuthenticated] = useState(false);
  const [sectionResetNonce, setSectionResetNonce] = useState(0);
  const [authInitialMode, setAuthInitialMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [matchFocus, setMatchFocus] = useState<MatchFocus | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const setActiveSection = useCallback((section: SectionName) => {
    setActiveSectionState(section);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setNotification({ message, type });
      setTimeout(() => {
        setNotification((prev) => (prev?.message === message ? null : prev));
      }, 3800);
    },
    []
  );

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        setAllUsers([]);
        return;
      }
      const data = await res.json();
      if (data.users) {
        setAllUsers(data.users);
      }
    } catch {
      // Erreur réseau silencieuse
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const [meRes, demoRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/auth/demo'),
      ]);

      if (demoRes.ok) {
        const demoData = await demoRes.json();
        if (demoData.demoUsers) setDemoUsers(demoData.demoUsers);
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData.user || null);
        if (meData.user) {
          await refreshUsers();
          if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (
              params.get('section') === 'TABLEAU_DE_BORD' &&
              meData.user.role === 'ADMINISTRATEUR'
            ) {
              setActiveSectionState('TABLEAU_DE_BORD');
              window.history.replaceState({}, '', '/');
            }
          }
        } else {
          setAllUsers([]);
        }
      }
    } catch {
      // Erreur réseau silencieuse au chargement initial
    } finally {
      setAuthLoading(false);
    }
  }, [refreshUsers]);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (phone: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connexion impossible.');
      }
      if (
        pendingFormAction === 'NEW_OFFER' &&
        data.user.role !== 'PRODUCTEUR' &&
        data.user.role !== 'ADMINISTRATEUR'
      ) {
        throw new Error(
          'Veuillez vous connecter avec un compte Producteur pour publier une offre de récolte.'
        );
      }
      if (
        pendingFormAction === 'NEW_DEMAND' &&
        data.user.role !== 'ACHETEUR' &&
        data.user.role !== 'ADMINISTRATEUR'
      ) {
        throw new Error(
          'Veuillez vous connecter avec un compte Acheteur pour déposer une demande d’achat.'
        );
      }
      setCurrentUser(data.user);
      setIsExplicitlyAuthenticated(true);
      await refreshUsers();
      if (pendingFormAction === 'NEW_OFFER') {
        setActiveSection('OFFRES');
      } else if (pendingFormAction === 'NEW_DEMAND') {
        setActiveSection('DEMANDES');
      } else {
        setActiveSection(getDefaultSectionForRole(data.user.role));
      }
      notify(`Bienvenue, ${data.user.name}.`, 'success');
    },
    [notify, pendingFormAction, refreshUsers, setActiveSection]
  );

  const loginAdmin = useCallback(
    async (identifier: string, password: string) => {
      let res: Response;
      try {
        res = await fetch('/api/auth/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
      } catch {
        throw new Error(
          'Impossible de joindre le serveur pour le moment. Veuillez réessayer dans quelques instants.'
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Identifiants administrateur invalides.');
      }
      setCurrentUser(data.user);
      setIsExplicitlyAuthenticated(true);
      setPendingFormAction(null);
      await refreshUsers();
      setActiveSection('TABLEAU_DE_BORD');
      notify(`Bienvenue dans l’espace administrateur, ${data.user.name}.`, 'success');
    },
    [notify, refreshUsers, setActiveSection]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Création de compte impossible.');
      }
      setCurrentUser(data.user);
      setIsExplicitlyAuthenticated(true);
      await refreshUsers();
      if (pendingFormAction === 'NEW_OFFER') {
        setActiveSection('OFFRES');
      } else if (pendingFormAction === 'NEW_DEMAND') {
        setActiveSection('DEMANDES');
      } else {
        setActiveSection(getDefaultSectionForRole(data.user.role));
      }
      notify(`Compte créé avec succès. Bienvenue, ${data.user.name}.`, 'success');
    },
    [notify, pendingFormAction, refreshUsers, setActiveSection]
  );

  const quickConnect = useCallback(
    async (payload: QuickConnectPayload) => {
      const strictRole =
        pendingFormAction === 'NEW_OFFER' || pendingFormAction === 'NEW_DEMAND';
      let res: Response;
      try {
        res = await fetch('/api/auth/quick-access', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, strictRole }),
        });
      } catch {
        throw new Error(
          'Impossible de joindre le serveur pour le moment. Veuillez réessayer dans quelques instants.'
        );
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Connexion impossible.');
      }
      setCurrentUser(data.user);
      setIsExplicitlyAuthenticated(true);
      await refreshUsers();
      if (pendingFormAction === 'NEW_OFFER') {
        setActiveSection('OFFRES');
      } else if (pendingFormAction === 'NEW_DEMAND') {
        setActiveSection('DEMANDES');
      } else {
        setActiveSection(getDefaultSectionForRole(data.user.role));
      }
      notify(`Bienvenue, ${data.user.name}.`, 'success');
    },
    [notify, pendingFormAction, refreshUsers, setActiveSection]
  );

  const loginDemo = useCallback(
    async (
      target: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR' | { userId: string },
      targetSection?: SectionName
    ) => {
      const body = typeof target === 'string' ? { role: target } : { userId: target.userId };
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.error || 'Impossible d’ouvrir la session de démonstration.', 'error');
        return;
      }
      if (
        activeSection === 'CONNEXION' &&
        pendingFormAction === 'NEW_OFFER' &&
        data.user.role !== 'PRODUCTEUR' &&
        data.user.role !== 'ADMINISTRATEUR'
      ) {
        notify('Veuillez sélectionner un profil Producteur pour publier une offre.', 'error');
        return;
      }
      if (
        activeSection === 'CONNEXION' &&
        pendingFormAction === 'NEW_DEMAND' &&
        data.user.role !== 'ACHETEUR' &&
        data.user.role !== 'ADMINISTRATEUR'
      ) {
        notify('Veuillez sélectionner un profil Acheteur pour déposer une demande d’achat.', 'error');
        return;
      }
      setCurrentUser(data.user);
      const fromAuthScreen = activeSection === 'CONNEXION';
      setIsExplicitlyAuthenticated(fromAuthScreen);
      await refreshUsers();
      if (fromAuthScreen && pendingFormAction === 'NEW_OFFER') {
        setActiveSection('OFFRES');
      } else if (fromAuthScreen && pendingFormAction === 'NEW_DEMAND') {
        setActiveSection('DEMANDES');
      } else if (targetSection && (targetSection !== 'TABLEAU_DE_BORD' || data.user.role === 'ADMINISTRATEUR')) {
        setActiveSection(targetSection);
      } else if (activeSection === 'ACCUEIL' || activeSection === 'CONNEXION') {
        setActiveSection(getDefaultSectionForRole(data.user.role));
      }
      notify(`Session active : ${data.user.name}`, 'info');
    },
    [activeSection, notify, pendingFormAction, refreshUsers, setActiveSection]
  );

  const startPublishOffer = useCallback(() => {
    setPendingFormAction('NEW_OFFER');
    if (
      isExplicitlyAuthenticated &&
      currentUser &&
      (currentUser.role === 'PRODUCTEUR' || currentUser.role === 'ADMINISTRATEUR') &&
      activeSection !== 'ACCUEIL'
    ) {
      setActiveSection('OFFRES');
    } else {
      setIsExplicitlyAuthenticated(false);
      setAuthInitialMode('LOGIN');
      setActiveSection('CONNEXION');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection, currentUser, isExplicitlyAuthenticated]);

  const startDepositDemand = useCallback(() => {
    setPendingFormAction('NEW_DEMAND');
    if (
      isExplicitlyAuthenticated &&
      currentUser &&
      (currentUser.role === 'ACHETEUR' || currentUser.role === 'ADMINISTRATEUR') &&
      activeSection !== 'ACCUEIL'
    ) {
      setActiveSection('DEMANDES');
    } else {
      setIsExplicitlyAuthenticated(false);
      setAuthInitialMode('LOGIN');
      setActiveSection('CONNEXION');
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeSection, currentUser, isExplicitlyAuthenticated]);

  const triggerSectionReset = useCallback(() => {
    setPendingFormAction(null);
    setSectionResetNonce((n) => n + 1);
  }, []);

  const openAuth = useCallback((mode: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    setAuthInitialMode(mode);
    setActiveSection('CONNEXION');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setCurrentUser(null);
      setIsExplicitlyAuthenticated(false);
      setPendingFormAction(null);
      setAllUsers([]);
      setMatchFocus(null);
      setActiveSection('ACCUEIL');
      notify('Vous êtes déconnecté.', 'info');
    }
  }, [notify, setActiveSection]);

  const openMatchingFor = useCallback(
    (focus: MatchFocus) => {
      setMatchFocus(focus);
      setActiveSection('MISE_EN_RELATION');
    },
    [setActiveSection]
  );

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        demoUsers,
        allUsers,
        refreshUsers,
        refreshSession,
        activeSection,
        setActiveSection,
        pendingFormAction,
        setPendingFormAction,
        isExplicitlyAuthenticated,
        startPublishOffer,
        startDepositDemand,
        sectionResetNonce,
        triggerSectionReset,
        authInitialMode,
        openAuth,
        matchFocus,
        setMatchFocus,
        openMatchingFor,
        login,
        loginAdmin,
        register,
        quickConnect,
        loginDemo,
        logout,
        notification,
        notify,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp doit être utilisé dans un AppProvider');
  }
  return context;
}
