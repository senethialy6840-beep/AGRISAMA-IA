import { prisma } from '../prisma';
import { hashPassword, USER_PUBLIC_SELECT, verifyPassword } from '../auth';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../errors';

export interface CreateUserInput {
  role: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
  organization?: string;
  password?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  location?: string;
  organization?: string;
}

export function cleanPhone(raw: string): string {
  const trimmed = (raw || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    throw new ValidationError('Le numéro de téléphone est obligatoire.');
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) {
    throw new ValidationError('Veuillez saisir un numéro de téléphone valide.');
  }
  return trimmed;
}

export function normalizePhoneDigits(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 9 && /^(70|75|76|77|78|33)/.test(digits)) {
    return `221${digits}`;
  }
  return digits;
}

async function findUserByPhoneFlexible(rawPhone: string) {
  const cleaned = cleanPhone(rawPhone);
  const exact = await prisma.user.findUnique({ where: { phone: cleaned } });
  if (exact) return exact;

  const targetDigits = normalizePhoneDigits(cleaned);
  const candidates = await prisma.user.findMany();
  return (
    candidates.find((u) => normalizePhoneDigits(u.phone) === targetDigits) || null
  );
}

export async function listUsers(role?: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR') {
  return await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: {
      ...USER_PUBLIC_SELECT,
      offers: {
        orderBy: { createdAt: 'desc' },
      },
      demands: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      ...USER_PUBLIC_SELECT,
      offers: {
        orderBy: { createdAt: 'desc' },
      },
      demands: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

export async function createUser(input: CreateUserInput) {
  if (!['ADMINISTRATEUR', 'PRODUCTEUR', 'ACHETEUR'].includes(input.role)) {
    throw new ValidationError('Rôle utilisateur invalide.');
  }
  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('Le nom complet est obligatoire (2 caractères minimum).');
  }
  if (!input.location || input.location.trim().length < 2) {
    throw new ValidationError('La localisation est obligatoire.');
  }

  const phone = cleanPhone(input.phone);
  const existing = await findUserByPhoneFlexible(phone);
  if (existing) {
    throw new ConflictError('Ce numéro de téléphone est déjà enregistré.');
  }

  let passwordHash: string | null = null;
  if (input.password !== undefined) {
    if (input.password.length < 6) {
      throw new ValidationError('Le mot de passe doit contenir au moins 6 caractères.');
    }
    passwordHash = hashPassword(input.password);
  }

  return await prisma.user.create({
    data: {
      role: input.role,
      name: input.name.trim(),
      phone,
      location: input.location.trim(),
      organization: input.organization?.trim() || null,
      passwordHash,
    },
    select: {
      ...USER_PUBLIC_SELECT,
      offers: true,
      demands: true,
    },
  });
}

export async function authenticateUser(phone: string, password: string) {
  if (!phone || !password) {
    throw new ValidationError('Veuillez saisir votre téléphone et votre mot de passe.');
  }
  const user = await findUserByPhoneFlexible(phone);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new UnauthorizedError('Numéro de téléphone ou mot de passe incorrect.');
  }
  return {
    id: user.id,
    role: user.role as 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR',
    name: user.name,
    phone: user.phone,
    location: user.location,
    organization: user.organization,
  };
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
  actor?: { id: string; role: string }
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Utilisateur introuvable.');
  }

  if (actor && actor.role !== 'ADMINISTRATEUR' && actor.id !== id) {
    throw new ForbiddenError('Action non autorisée : vous ne pouvez modifier que votre propre profil.');
  }

  const data: Record<string, string | null> = {};
  if (input.name !== undefined) {
    if (input.name.trim().length < 2) {
      throw new ValidationError('Le nom doit comporter au moins 2 caractères.');
    }
    data.name = input.name.trim();
  }
  if (input.phone !== undefined) {
    const nextPhone = cleanPhone(input.phone);
    if (normalizePhoneDigits(nextPhone) !== normalizePhoneDigits(existing.phone)) {
      const collision = await findUserByPhoneFlexible(nextPhone);
      if (collision && collision.id !== id) {
        throw new ConflictError('Ce numéro de téléphone est déjà utilisé par un autre compte.');
      }
    }
    data.phone = nextPhone;
  }
  if (input.location !== undefined) {
    if (input.location.trim().length < 2) {
      throw new ValidationError('La localisation est obligatoire.');
    }
    data.location = input.location.trim();
  }
  if (input.organization !== undefined) {
    data.organization = input.organization.trim() || null;
  }

  return await prisma.user.update({
    where: { id },
    data,
    select: {
      ...USER_PUBLIC_SELECT,
      offers: { orderBy: { createdAt: 'desc' } },
      demands: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export interface QuickConnectActorInput {
  role: 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
  strictRole?: boolean;
}

export async function connectOrCreateActor(input: QuickConnectActorInput) {
  if (input.role !== 'PRODUCTEUR' && input.role !== 'ACHETEUR') {
    throw new ValidationError('Veuillez choisir un profil Producteur ou Acheteur.');
  }
  const trimmedName = (input.name || '').trim();
  if (trimmedName.length < 2) {
    throw new ValidationError('Le nom complet est obligatoire (2 caractères minimum).');
  }
  const trimmedLocation = (input.location || '').trim();
  if (trimmedLocation.length < 2) {
    throw new ValidationError('La localisation est obligatoire.');
  }

  const phone = cleanPhone(input.phone);
  const existing = await findUserByPhoneFlexible(phone);

  if (existing) {
    if (existing.role === 'ADMINISTRATEUR') {
      throw new ForbiddenError(
        'Ce numéro est réservé. Veuillez saisir un numéro Producteur ou Acheteur.'
      );
    }
    if (input.strictRole && existing.role !== input.role) {
      const expectedLabel = input.role === 'PRODUCTEUR' ? 'Producteur' : 'Acheteur';
      const actualLabel = existing.role === 'PRODUCTEUR' ? 'Producteur' : 'Acheteur';
      throw new ForbiddenError(
        `Ce numéro est déjà associé à un profil ${actualLabel}. Veuillez utiliser un numéro ${expectedLabel}.`
      );
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: trimmedName,
        location: trimmedLocation,
      },
      select: USER_PUBLIC_SELECT,
    });

    return {
      user: {
        ...updated,
        role: updated.role as 'PRODUCTEUR' | 'ACHETEUR',
      },
      created: false,
    };
  }

  const created = await prisma.user.create({
    data: {
      role: input.role,
      name: trimmedName,
      phone,
      location: trimmedLocation,
      organization: null,
      passwordHash: null,
    },
    select: USER_PUBLIC_SELECT,
  });

  return {
    user: {
      ...created,
      role: created.role as 'PRODUCTEUR' | 'ACHETEUR',
    },
    created: true,
  };
}
