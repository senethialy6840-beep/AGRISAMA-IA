export const PRODUCTS_LIST = [
  'Oignon Violet de Galmi',
  'Oignon Yaakaar',
  'Oignon Blanc',
  'Oignon Rouge de Potou',
  'Oignon Safari',
] as const;

export interface LocationInfo {
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

// Localités productrices d'oignons au Sénégal (Bassin des Niayes & Vallée du Fleuve Sénégal)
export const PRODUCER_LOCATIONS_LIST: LocationInfo[] = [
  { name: 'Notto Gouye Diama (Niayes)', zone: 'Niayes', lat: 14.9667, lng: -17.0333 },
  { name: 'Mboro (Niayes)', zone: 'Niayes', lat: 15.1404, lng: -16.8851 },
  { name: 'Diogo (Niayes)', zone: 'Niayes', lat: 15.3011, lng: -16.7519 },
  { name: 'Potou (Niayes)', zone: 'Niayes', lat: 15.7333, lng: -16.5000 },
  { name: 'Kayar (Niayes)', zone: 'Niayes', lat: 14.9167, lng: -17.1167 },
  { name: 'Lompoul (Niayes)', zone: 'Niayes', lat: 15.4500, lng: -16.6833 },
  { name: 'Bayakh (Niayes)', zone: 'Niayes', lat: 14.8197, lng: -17.1292 },
  { name: 'Darou Khoudoss (Niayes)', zone: 'Niayes', lat: 15.1067, lng: -16.8542 },
  { name: 'Keur Moussa (Niayes)', zone: 'Niayes', lat: 14.7833, lng: -17.1167 },
  { name: 'Gandon (Niayes / Saint-Louis)', zone: 'Niayes', lat: 15.9667, lng: -16.4333 },
  { name: 'Rao (Niayes / Saint-Louis)', zone: 'Niayes', lat: 15.9167, lng: -16.4167 },
  { name: 'Podor (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 16.6519, lng: -14.9589 },
  { name: 'Dagana (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 16.5167, lng: -15.5000 },
  { name: 'Ross Béthio (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 16.2667, lng: -16.1333 },
  { name: 'Richard-Toll (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 16.4625, lng: -15.7008 },
  { name: 'Ndioum (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 16.5128, lng: -14.6471 },
  { name: 'Matam (Vallée du Fleuve)', zone: 'Vallée du Fleuve', lat: 15.6559, lng: -13.2554 },
];

// Marchés et pôles d'achat urbains au Sénégal
export const BUYER_LOCATIONS_LIST: LocationInfo[] = [
  { name: 'Dakar — Marché Thiaroye', zone: 'Dakar', lat: 14.7485, lng: -17.3855 },
  { name: 'Dakar — Marché Castor', zone: 'Dakar', lat: 14.7219, lng: -17.4312 },
  { name: 'Thiès — Marché Central', zone: 'Thiès', lat: 14.7910, lng: -16.9256 },
  { name: 'Touba — Marché Ocass', zone: 'Diourbel', lat: 14.8500, lng: -15.8800 },
  { name: 'Saint-Louis — Sor', zone: 'Saint-Louis', lat: 16.0179, lng: -16.4896 },
  { name: 'Kaolack — Marché Central', zone: 'Kaolack', lat: 14.1500, lng: -16.0700 },
  { name: 'Mbour — Marché Central', zone: 'Thiès', lat: 14.4167, lng: -16.9667 },
  { name: 'Louga — Marché Central', zone: 'Louga', lat: 15.6186, lng: -16.2244 },
];

export const LOCATIONS_LIST: LocationInfo[] = [
  ...PRODUCER_LOCATIONS_LIST,
  ...BUYER_LOCATIONS_LIST,
];

export const QUALITY_OPTIONS = [
  'Catégorie 1',
  'Standard',
  'Catégorie 2',
] as const;

export const DEMAND_QUALITY_OPTIONS = [
  'Catégorie 1',
  'Standard',
  'Catégorie 2',
  'Toutes qualités',
] as const;

export const OFFER_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  DISPONIBLE: {
    label: 'Disponible',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  RESERVEE: {
    label: 'Réservée',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  VENDUE: {
    label: 'Vendue',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

export const DEMAND_STATUS_LABELS: Record<string, { label: string; badgeClass: string }> = {
  ACTIVE: {
    label: 'Active',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  CLOTUREE: {
    label: 'Clôturée',
    badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  },
};

export const ROLE_LABELS: Record<string, string> = {
  ADMINISTRATEUR: 'Administrateur',
  PRODUCTEUR: 'Producteur',
  ACHETEUR: 'Acheteur',
};
