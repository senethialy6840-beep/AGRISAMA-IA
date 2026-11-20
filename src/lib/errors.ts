import { NextResponse } from 'next/server';

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentification requise. Veuillez vous connecter.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Action non autorisée pour votre profil.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable.') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Convertit toute erreur métier ou Prisma en réponse JSON sécurisée avec code HTTP adapté.
 */
export function toErrorResponse(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.statusCode }
    );
  }

  // Gestion des contraintes uniques Prisma (ex: téléphone déjà utilisé)
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Cette valeur existe déjà dans la base de données.' },
        { status: 409 }
      );
    }
    if (code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Ressource introuvable.' },
        { status: 404 }
      );
    }
  }

  const message =
    err instanceof Error && err.message ? err.message : 'Une erreur interne est survenue.';
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}
