import { prisma } from '../prisma';
import { LOCATIONS_LIST } from '../constants';
import { USER_PUBLIC_SELECT } from '../auth';

export function calculateDistanceKm(locA: string, locB: string): number {
  const infoA = LOCATIONS_LIST.find((l) => l.name === locA);
  const infoB = LOCATIONS_LIST.find((l) => l.name === locB);

  if (!infoA || !infoB) {
    return locA.trim().toLowerCase() === locB.trim().toLowerCase() ? 5 : 65;
  }

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(infoB.lat - infoA.lat);
  const dLng = toRad(infoB.lng - infoA.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(infoA.lat)) *
      Math.cos(toRad(infoB.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface MatchComputationResult {
  isCompatible: boolean;
  compatibilityScore: number;
  quantityScore: number;
  priceScore: number;
  locationScore: number;
  dateScore: number;
  qualityScore: number;
  explanation: string;
}

export function computeCompatibility(
  offer: {
    product: string;
    quantityKg: number;
    pricePerKg: number;
    location: string;
    availableDate: Date | string;
    quality: string;
    status?: string;
  },
  demand: {
    product: string;
    quantityKg: number;
    maxPricePerKg: number;
    location: string;
    desiredDate: Date | string;
    quality: string;
    status?: string;
  }
): MatchComputationResult {
  // 1. Produit recherché (filtre bloquant)
  const prodOffer = offer.product.trim().toLowerCase();
  const prodDemand = demand.product.trim().toLowerCase();
  const isSameExactProduct = prodOffer === prodDemand;
  const isBothOnion = prodOffer.includes('oignon') && prodDemand.includes('oignon');

  if (!isSameExactProduct && !isBothOnion) {
    return {
      isCompatible: false,
      compatibilityScore: 0,
      quantityScore: 0,
      priceScore: 0,
      locationScore: 0,
      dateScore: 0,
      qualityScore: 0,
      explanation: 'Produit non compatible.',
    };
  }

  if (offer.status && offer.status !== 'DISPONIBLE') {
    return {
      isCompatible: false,
      compatibilityScore: 0,
      quantityScore: 0,
      priceScore: 0,
      locationScore: 0,
      dateScore: 0,
      qualityScore: 0,
      explanation: 'Offre non disponible.',
    };
  }

  // 2. Quantité disponible (poids 25 %)
  const qtyRatio = offer.quantityKg / demand.quantityKg;
  let quantityScore = 0;
  if (qtyRatio >= 1) {
    quantityScore = 100;
  } else if (qtyRatio >= 0.25) {
    quantityScore = Math.round(qtyRatio * 100);
  } else {
    return {
      isCompatible: false,
      compatibilityScore: 0,
      quantityScore: 0,
      priceScore: 0,
      locationScore: 0,
      dateScore: 0,
      qualityScore: 0,
      explanation: 'Quantité trop faible par rapport au besoin.',
    };
  }

  // 3. Prix (poids 25 %)
  let priceScore = 0;
  if (offer.pricePerKg <= demand.maxPricePerKg) {
    priceScore = 100;
  } else {
    const overPct = (offer.pricePerKg - demand.maxPricePerKg) / demand.maxPricePerKg;
    if (overPct > 0.3) {
      return {
        isCompatible: false,
        compatibilityScore: 0,
        quantityScore,
        priceScore: 0,
        locationScore: 0,
        dateScore: 0,
        qualityScore: 0,
        explanation: 'Prix supérieur de plus de 30 % au budget maximum.',
      };
    }
    priceScore = Math.round(Math.max(30, 100 - overPct * 220));
  }

  // 4. Localisation (poids 20 %)
  const distKm = calculateDistanceKm(offer.location, demand.location);
  let locationScore = 65;
  if (distKm <= 30) locationScore = 100;
  else if (distKm <= 80) locationScore = 90;
  else if (distKm <= 160) locationScore = 80;
  else locationScore = 65;

  // 5. Date de disponibilité (poids 15 %)
  const availMs = new Date(offer.availableDate).getTime();
  const desiredMs = new Date(demand.desiredDate).getTime();
  const diffDays = Math.round((availMs - desiredMs) / (24 * 3600 * 1000));
  let dateScore = 0;
  if (diffDays <= 0) {
    dateScore = 100;
  } else if (diffDays <= 7) {
    dateScore = Math.round(100 - diffDays * 8);
  } else {
    return {
      isCompatible: false,
      compatibilityScore: 0,
      quantityScore,
      priceScore,
      locationScore,
      dateScore: 0,
      qualityScore: 0,
      explanation: 'Date de disponibilité trop tardive pour la demande.',
    };
  }

  // 6. Qualité (poids 15 %)
  const qualityRank: Record<string, number> = {
    'Catégorie 1': 3,
    Standard: 2,
    'Catégorie 2': 1,
  };
  let qualityScore = 80;
  if (demand.quality === 'Toutes qualités' || offer.quality === demand.quality) {
    qualityScore = 100;
  } else if ((qualityRank[offer.quality] || 2) > (qualityRank[demand.quality] || 2)) {
    qualityScore = 95;
  } else {
    qualityScore = 60;
  }

  const varietyFactor = isSameExactProduct ? 1 : 0.92;

  const rawScore =
    0.25 * quantityScore +
    0.25 * priceScore +
    0.20 * locationScore +
    0.15 * dateScore +
    0.15 * qualityScore;

  const compatibilityScore = Math.round(rawScore * varietyFactor);

  const strengths: string[] = [];
  strengths.push(isSameExactProduct ? 'produit compatible' : 'variété d’oignon compatible');
  if (quantityScore === 100) {
    strengths.push('quantité suffisante');
  } else {
    strengths.push(`couverture partielle (${quantityScore} % du volume)`);
  }
  if (priceScore === 100) {
    strengths.push('prix respecté');
  } else {
    strengths.push('prix proche du budget');
  }
  if (locationScore >= 80) {
    strengths.push('localisation adaptée');
  }
  if (dateScore >= 90 && qualityScore >= 95) {
    strengths.push('qualité et disponibilité conformes');
  }

  const explanation = `Correspondance à ${compatibilityScore} % : ${strengths.slice(0, 4).join(', ')}.`;

  return {
    isCompatible: true,
    compatibilityScore,
    quantityScore,
    priceScore,
    locationScore,
    dateScore,
    qualityScore,
    explanation,
  };
}

let activeSyncPromise: Promise<void> | null = null;

async function performAtomicMatchSync() {
  const [availableOffers, activeDemands] = await Promise.all([
    prisma.offer.findMany({
      where: { status: 'DISPONIBLE' },
    }),
    prisma.demand.findMany({
      where: { status: 'ACTIVE' },
    }),
  ]);

  const toCreate: Array<{
    offerId: string;
    demandId: string;
    compatibilityScore: number;
    quantityScore: number;
    priceScore: number;
    locationScore: number;
    dateScore: number;
    qualityScore: number;
    explanation: string;
  }> = [];

  for (const offer of availableOffers) {
    for (const demand of activeDemands) {
      const evalResult = computeCompatibility(offer, demand);
      if (evalResult.isCompatible && evalResult.compatibilityScore >= 50) {
        toCreate.push({
          offerId: offer.id,
          demandId: demand.id,
          compatibilityScore: evalResult.compatibilityScore,
          quantityScore: evalResult.quantityScore,
          priceScore: evalResult.priceScore,
          locationScore: evalResult.locationScore,
          dateScore: evalResult.dateScore,
          qualityScore: evalResult.qualityScore,
          explanation: evalResult.explanation,
        });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({});
    if (toCreate.length > 0) {
      await tx.match.createMany({ data: toCreate });
    }
  });
}

export async function syncAllMatches() {
  if (activeSyncPromise) {
    await activeSyncPromise;
  }
  activeSyncPromise = performAtomicMatchSync().finally(() => {
    activeSyncPromise = null;
  });
  await activeSyncPromise;
}

export async function listMatches(filters: {
  producerId?: string;
  buyerId?: string;
  offerId?: string;
  demandId?: string;
  product?: string;
} = {}) {
  await syncAllMatches();

  const where: any = {};
  if (filters.offerId) where.offerId = filters.offerId;
  if (filters.demandId) where.demandId = filters.demandId;
  if (filters.producerId || filters.product) {
    where.offer = {};
    if (filters.producerId) where.offer.producerId = filters.producerId;
    if (filters.product) where.offer.product = filters.product;
  }
  if (filters.buyerId) where.demand = { buyerId: filters.buyerId };

  return await prisma.match.findMany({
    where,
    include: {
      offer: { include: { producer: { select: USER_PUBLIC_SELECT } } },
      demand: { include: { buyer: { select: USER_PUBLIC_SELECT } } },
    },
    orderBy: { compatibilityScore: 'desc' },
  });
}
