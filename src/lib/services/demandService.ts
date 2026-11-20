import { prisma } from '../prisma';
import { assertOnionProduct, computeQuantityKg } from './offerService';
import { syncAllMatches } from './matchingService';
import { USER_PUBLIC_SELECT } from '../auth';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors';

export interface CreateDemandInput {
  buyerId: string;
  product: string;
  quantityValue: number;
  quantityUnit: 'KG' | 'TONNE';
  maxPricePerKg: number;
  location: string;
  desiredDate: string | Date;
  quality: string;
}

export interface UpdateDemandInput {
  product?: string;
  quantityValue?: number;
  quantityUnit?: 'KG' | 'TONNE';
  maxPricePerKg?: number;
  location?: string;
  desiredDate?: string | Date;
  quality?: string;
  status?: 'ACTIVE' | 'CLOTUREE';
}

const VALID_STATUSES = ['ACTIVE', 'CLOTUREE'];

export async function createDemand(input: CreateDemandInput) {
  if (!input.buyerId) {
    throw new ValidationError('Veuillez sélectionner un acheteur.');
  }
  const validatedProduct = assertOnionProduct(input.product);
  const maxPrice = Number(input.maxPricePerKg);
  if (!Number.isFinite(maxPrice) || maxPrice <= 0) {
    throw new ValidationError('Le prix maximum est obligatoire et doit être positif.');
  }
  if (!input.location || !input.location.trim()) {
    throw new ValidationError('La localisation de livraison est obligatoire.');
  }
  if (!input.quality || !input.quality.trim()) {
    throw new ValidationError('La qualité recherchée est obligatoire.');
  }

  const buyer = await prisma.user.findUnique({ where: { id: input.buyerId } });
  if (!buyer || (buyer.role !== 'ACHETEUR' && buyer.role !== 'ADMINISTRATEUR')) {
    throw new ForbiddenError('Acheteur introuvable ou rôle non autorisé.');
  }

  const unit = input.quantityUnit === 'TONNE' ? 'TONNE' : 'KG';
  const quantityKg = computeQuantityKg(input.quantityValue, unit);
  const desiredDate = new Date(input.desiredDate);
  if (isNaN(desiredDate.getTime())) {
    throw new ValidationError('La date souhaitée est invalide.');
  }

  const demand = await prisma.demand.create({
    data: {
      buyerId: input.buyerId,
      product: validatedProduct,
      quantityValue: Number(input.quantityValue),
      quantityUnit: unit,
      quantityKg,
      maxPricePerKg: maxPrice,
      location: input.location.trim(),
      desiredDate,
      quality: input.quality.trim(),
      status: 'ACTIVE',
    },
    include: {
      buyer: { select: USER_PUBLIC_SELECT },
    },
  });

  await syncAllMatches();
  return demand;
}

export async function updateDemand(
  id: string,
  input: UpdateDemandInput,
  actor?: { id: string; role: string }
) {
  const existing = await prisma.demand.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Demande d’achat introuvable.');
  }

  if (actor && actor.role !== 'ADMINISTRATEUR' && existing.buyerId !== actor.id) {
    throw new ForbiddenError('Vous ne pouvez modifier que vos propres demandes d’achat.');
  }

  const nextUnit = (input.quantityUnit || existing.quantityUnit) as 'KG' | 'TONNE';
  const nextVal =
    input.quantityValue !== undefined ? Number(input.quantityValue) : existing.quantityValue;
  const nextKg = computeQuantityKg(nextVal, nextUnit);

  let nextPrice = existing.maxPricePerKg;
  if (input.maxPricePerKg !== undefined) {
    nextPrice = Number(input.maxPricePerKg);
    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      throw new ValidationError('Le prix maximum doit être positif.');
    }
  }

  let nextDate = existing.desiredDate;
  if (input.desiredDate !== undefined) {
    nextDate = new Date(input.desiredDate);
    if (isNaN(nextDate.getTime())) {
      throw new ValidationError('La date souhaitée est invalide.');
    }
  }

  if (input.status !== undefined && !VALID_STATUSES.includes(input.status)) {
    throw new ValidationError('Statut de demande invalide.');
  }

  const updated = await prisma.demand.update({
    where: { id },
    data: {
      product: input.product !== undefined ? assertOnionProduct(input.product) : existing.product,
      quantityValue: nextVal,
      quantityUnit: nextUnit,
      quantityKg: nextKg,
      maxPricePerKg: nextPrice,
      location: input.location !== undefined ? input.location.trim() : existing.location,
      desiredDate: nextDate,
      quality: input.quality !== undefined ? input.quality.trim() : existing.quality,
      status: input.status !== undefined ? input.status : existing.status,
    },
    include: {
      buyer: { select: USER_PUBLIC_SELECT },
    },
  });

  await syncAllMatches();
  return updated;
}

export async function deleteDemand(id: string, actor: { id: string; role: string }) {
  const existing = await prisma.demand.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Demande d’achat introuvable.');
  }
  if (actor.role !== 'ADMINISTRATEUR' && existing.buyerId !== actor.id) {
    throw new ForbiddenError('Vous ne pouvez supprimer que vos propres demandes d’achat.');
  }
  await prisma.demand.delete({ where: { id } });
  await syncAllMatches();
}

export async function listDemands(filters: {
  buyerId?: string;
  status?: string;
  product?: string;
} = {}) {
  const where: any = {};
  if (filters.buyerId) where.buyerId = filters.buyerId;
  if (filters.status) where.status = filters.status;
  if (filters.product) where.product = filters.product;

  return await prisma.demand.findMany({
    where,
    include: {
      buyer: { select: USER_PUBLIC_SELECT },
    },
    orderBy: { createdAt: 'desc' },
  });
}
