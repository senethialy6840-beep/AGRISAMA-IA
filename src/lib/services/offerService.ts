import { prisma } from '../prisma';
import { syncAllMatches } from './matchingService';
import { USER_PUBLIC_SELECT } from '../auth';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../errors';

export interface CreateOfferInput {
  producerId: string;
  product: string;
  quantityValue: number;
  quantityUnit: 'KG' | 'TONNE';
  pricePerKg: number;
  location: string;
  availableDate: string | Date;
  quality: string;
  status?: 'DISPONIBLE' | 'RESERVEE' | 'VENDUE';
  imageUrl?: string | null;
}

export interface UpdateOfferInput {
  product?: string;
  quantityValue?: number;
  quantityUnit?: 'KG' | 'TONNE';
  pricePerKg?: number;
  location?: string;
  availableDate?: string | Date;
  quality?: string;
  status?: 'DISPONIBLE' | 'RESERVEE' | 'VENDUE';
  imageUrl?: string | null;
}

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/images/')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    throw new ValidationError('URL de photo invalide.');
  }
  throw new ValidationError('URL de photo invalide.');
}

const VALID_STATUSES = ['DISPONIBLE', 'RESERVEE', 'VENDUE'];

export function computeQuantityKg(value: number, unit: 'KG' | 'TONNE'): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) {
    throw new ValidationError('La quantité doit être supérieure à zéro.');
  }
  return unit === 'TONNE' ? num * 1000 : num;
}

export function assertOnionProduct(product: string): string {
  const trimmed = (product || '').trim();
  if (!trimmed) {
    throw new ValidationError('La variété d’oignon est obligatoire.');
  }
  if (!trimmed.toLowerCase().includes('oignon')) {
    throw new ValidationError(
      'La plateforme est exclusivement dédiée à l’oignon. Veuillez sélectionner une variété d’oignon.'
    );
  }
  return trimmed;
}

export async function createOffer(input: CreateOfferInput) {
  if (!input.producerId) {
    throw new ValidationError('Veuillez sélectionner un producteur.');
  }
  const validatedProduct = assertOnionProduct(input.product);
  const price = Number(input.pricePerKg);
  if (!Number.isFinite(price) || price <= 0) {
    throw new ValidationError('Le prix souhaité doit être supérieur à zéro.');
  }
  if (!input.location || !input.location.trim()) {
    throw new ValidationError('La localisation est obligatoire.');
  }
  if (!input.quality || !input.quality.trim()) {
    throw new ValidationError('La qualité du produit est obligatoire.');
  }
  if (input.status && !VALID_STATUSES.includes(input.status)) {
    throw new ValidationError('Statut d’offre invalide.');
  }

  const producer = await prisma.user.findUnique({ where: { id: input.producerId } });
  if (!producer || (producer.role !== 'PRODUCTEUR' && producer.role !== 'ADMINISTRATEUR')) {
    throw new ForbiddenError('Producteur introuvable ou rôle non autorisé.');
  }

  const unit = input.quantityUnit === 'TONNE' ? 'TONNE' : 'KG';
  const quantityKg = computeQuantityKg(input.quantityValue, unit);
  const availableDate = new Date(input.availableDate);
  if (isNaN(availableDate.getTime())) {
    throw new ValidationError('La date de disponibilité est invalide.');
  }

  const offer = await prisma.offer.create({
    data: {
      producerId: input.producerId,
      product: validatedProduct,
      quantityValue: Number(input.quantityValue),
      quantityUnit: unit,
      quantityKg,
      pricePerKg: price,
      location: input.location.trim(),
      availableDate,
      quality: input.quality.trim(),
      status: input.status || 'DISPONIBLE',
      imageUrl: sanitizeImageUrl(input.imageUrl),
    },
    include: {
      producer: { select: USER_PUBLIC_SELECT },
    },
  });

  await syncAllMatches();
  return offer;
}

export async function updateOffer(
  id: string,
  input: UpdateOfferInput,
  actor?: { id: string; role: string }
) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Offre de récolte introuvable.');
  }

  if (actor && actor.role !== 'ADMINISTRATEUR' && existing.producerId !== actor.id) {
    throw new ForbiddenError('Vous ne pouvez modifier que vos propres offres de récolte.');
  }

  const nextUnit = (input.quantityUnit || existing.quantityUnit) as 'KG' | 'TONNE';
  const nextVal =
    input.quantityValue !== undefined ? Number(input.quantityValue) : existing.quantityValue;
  const nextKg = computeQuantityKg(nextVal, nextUnit);

  let nextPrice = existing.pricePerKg;
  if (input.pricePerKg !== undefined) {
    nextPrice = Number(input.pricePerKg);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      throw new ValidationError('Le prix souhaité doit être supérieur à zéro.');
    }
  }

  let nextDate = existing.availableDate;
  if (input.availableDate !== undefined) {
    nextDate = new Date(input.availableDate);
    if (isNaN(nextDate.getTime())) {
      throw new ValidationError('La date de disponibilité est invalide.');
    }
  }

  if (input.status !== undefined && !VALID_STATUSES.includes(input.status)) {
    throw new ValidationError('Statut d’offre invalide.');
  }

  const nextStatus = input.status !== undefined ? input.status : existing.status;

  const updated = await prisma.offer.update({
    where: { id },
    data: {
      product: input.product !== undefined ? assertOnionProduct(input.product) : existing.product,
      quantityValue: nextVal,
      quantityUnit: nextUnit,
      quantityKg: nextKg,
      pricePerKg: nextPrice,
      location: input.location !== undefined ? input.location.trim() : existing.location,
      availableDate: nextDate,
      quality: input.quality !== undefined ? input.quality.trim() : existing.quality,
      status: nextStatus,
      ...(input.imageUrl !== undefined
        ? { imageUrl: sanitizeImageUrl(input.imageUrl) }
        : {}),
      // Si l'offre repasse disponible manuellement, on libère le lien de réservation
      ...(nextStatus === 'DISPONIBLE'
        ? { reservedForDemandId: null, reservedByUserId: null }
        : {}),
    },
    include: {
      producer: { select: USER_PUBLIC_SELECT },
    },
  });

  await syncAllMatches();
  return updated;
}

export async function deleteOffer(id: string, actor: { id: string; role: string }) {
  const existing = await prisma.offer.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Offre de récolte introuvable.');
  }
  if (actor.role !== 'ADMINISTRATEUR' && existing.producerId !== actor.id) {
    throw new ForbiddenError('Vous ne pouvez supprimer que vos propres offres de récolte.');
  }
  await prisma.offer.delete({ where: { id } });
  await syncAllMatches();
}

export async function reserveOfferForDemand(
  offerId: string,
  demandId: string,
  actor: { id: string; role: string }
) {
  const [offer, demand] = await Promise.all([
    prisma.offer.findUnique({ where: { id: offerId } }),
    prisma.demand.findUnique({ where: { id: demandId } }),
  ]);

  if (!offer) throw new NotFoundError('Offre de récolte introuvable.');
  if (!demand) throw new NotFoundError('Demande d’achat introuvable.');

  if (
    actor.role !== 'ADMINISTRATEUR' &&
    demand.buyerId !== actor.id &&
    offer.producerId !== actor.id
  ) {
    throw new ForbiddenError(
      'Seul l’acheteur concerné, le producteur concerné ou l’administrateur peut réserver cette offre.'
    );
  }

  if (offer.status !== 'DISPONIBLE') {
    throw new ConflictError('Cette offre n’est plus disponible (déjà réservée ou vendue).');
  }
  if (demand.status !== 'ACTIVE') {
    throw new ConflictError('Cette demande d’achat est clôturée.');
  }

  const updated = await prisma.$transaction(async (tx) => {
    const fresh = await tx.offer.findUnique({ where: { id: offerId } });
    if (!fresh || fresh.status !== 'DISPONIBLE') {
      throw new ConflictError('Cette offre vient d’être réservée par un autre utilisateur.');
    }
    return await tx.offer.update({
      where: { id: offerId },
      data: {
        status: 'RESERVEE',
        reservedForDemandId: demandId,
        reservedByUserId: actor.id,
      },
      include: {
        producer: { select: USER_PUBLIC_SELECT },
        reservedForDemand: { include: { buyer: { select: USER_PUBLIC_SELECT } } },
        reservedByUser: { select: USER_PUBLIC_SELECT },
      },
    });
  });

  await syncAllMatches();
  return updated;
}

export async function releaseOfferReservation(
  offerId: string,
  actor: { id: string; role: string }
) {
  const existing = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { reservedForDemand: true },
  });
  if (!existing) {
    throw new NotFoundError('Offre de récolte introuvable.');
  }
  const canRelease =
    actor.role === 'ADMINISTRATEUR' ||
    existing.producerId === actor.id ||
    existing.reservedByUserId === actor.id ||
    existing.reservedForDemand?.buyerId === actor.id;

  if (!canRelease) {
    throw new ForbiddenError('Action non autorisée pour annuler cette réservation.');
  }
  if (existing.status !== 'RESERVEE') {
    throw new ValidationError('Cette offre n’est pas actuellement réservée.');
  }

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'DISPONIBLE',
      reservedForDemandId: null,
      reservedByUserId: null,
    },
    include: {
      producer: { select: USER_PUBLIC_SELECT },
    },
  });

  await syncAllMatches();
  return updated;
}

export async function listOffers(filters: {
  producerId?: string;
  status?: string;
  product?: string;
  reservedByOrForBuyerId?: string;
} = {}) {
  const where: any = {};
  if (filters.producerId) where.producerId = filters.producerId;
  if (filters.status) where.status = filters.status;
  if (filters.product) where.product = filters.product;
  if (filters.reservedByOrForBuyerId) {
    where.OR = [
      { reservedByUserId: filters.reservedByOrForBuyerId },
      { reservedForDemand: { buyerId: filters.reservedByOrForBuyerId } },
    ];
  }

  return await prisma.offer.findMany({
    where,
    include: {
      producer: { select: USER_PUBLIC_SELECT },
      reservedForDemand: { include: { buyer: { select: USER_PUBLIC_SELECT } } },
      reservedByUser: { select: USER_PUBLIC_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  });
}
