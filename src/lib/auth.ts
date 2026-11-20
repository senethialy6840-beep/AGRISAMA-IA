import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';
import { ForbiddenError, UnauthorizedError } from './errors';

export const SESSION_COOKIE_NAME = 'agrisama_session';
export const ADMIN_SESSION_USER_ID = 'admin-owner-agrisama';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export const USER_PUBLIC_SELECT = {
  id: true,
  role: true,
  name: true,
  phone: true,
  location: true,
  organization: true,
  createdAt: true,
  updatedAt: true,
} as const;

export interface SessionPayload {
  userId: string;
  role: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR';
  exp: number;
}

export interface AuthenticatedUser {
  id: string;
  role: 'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR';
  name: string;
  phone: string;
  location: string;
  organization: string | null;
}

export function getAdminProfile(): AuthenticatedUser {
  return {
    id: ADMIN_SESSION_USER_ID,
    role: 'ADMINISTRATEUR',
    name: (process.env.ADMIN_NAME || 'Administrateur AgriSama IA').trim(),
    phone: (process.env.ADMIN_PHONE || '+221 77 900 10 00').trim(),
    location: 'Dakar — Siège',
    organization: 'Administration AgriSama IA',
  };
}

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    'agrisama-ia-local-dev-session-signing-key-2026'
  );
}

/**
 * Hache un mot de passe avec un sel aléatoire (scrypt).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Vérifie un mot de passe en temps constant contre son empreinte stockée.
 */
export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;
  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function signSessionToken(payload: SessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as SessionPayload;
    if (!parsed.userId || !parsed.role || !parsed.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionCookie(
  response: NextResponse,
  user: { id: string; role: string },
  req?: NextRequest
) {
  const token = signSessionToken({
    userId: user.id,
    role: user.role as SessionPayload['role'],
    exp: Date.now() + SESSION_DURATION_MS,
  });

  const isHttps =
    req?.headers.get('x-forwarded-proto') === 'https' ||
    req?.nextUrl?.protocol === 'https:';

  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: Boolean(isHttps),
    path: '/',
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * Récupère l'utilisateur authentifié depuis le cookie HttpOnly signé.
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<AuthenticatedUser | null> {
  const token = req
    ? req.cookies.get(SESSION_COOKIE_NAME)?.value
    : cookies().get(SESSION_COOKIE_NAME)?.value;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  if (payload.role === 'ADMINISTRATEUR' && payload.userId === ADMIN_SESSION_USER_ID) {
    return getAdminProfile();
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: USER_PUBLIC_SELECT,
  });

  if (!user) return null;
  return {
    id: user.id,
    role: user.role as AuthenticatedUser['role'],
    name: user.name,
    phone: user.phone,
    location: user.location,
    organization: user.organization,
  };
}

/**
 * Exige une session authentifiée et éventuellement un rôle autorisé.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: Array<'ADMINISTRATEUR' | 'PRODUCTEUR' | 'ACHETEUR'>
): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    throw new UnauthorizedError();
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }
  return user;
}
