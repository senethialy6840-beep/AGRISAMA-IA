import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminProfile, setSessionCookie } from '@/lib/auth';
import { authenticateUser, normalizePhoneDigits } from '@/lib/services/userService';
import { toErrorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = String(body.phone || body.identifier || '').trim();
    const rawPassword = String(body.password || '');

    if (!rawIdentifier || !rawPassword) {
      throw new ValidationError('Veuillez saisir votre identifiant et votre mot de passe administrateur.');
    }

    const envPhone = (process.env.ADMIN_PHONE || '+221 77 900 10 00').trim();
    const envPassword = process.env.ADMIN_PASSWORD || 'Admin@AgriSama2026';

    const inputDigits = normalizePhoneDigits(rawIdentifier);
    const envDigits = normalizePhoneDigits(envPhone);
    const matchesIdentifier =
      rawIdentifier.toLowerCase() === 'admin' ||
      (inputDigits.length >= 7 && inputDigits === envDigits) ||
      rawIdentifier === envPhone;

    if (matchesIdentifier && safeEquals(rawPassword, envPassword)) {
      const adminUser = getAdminProfile();
      const response = NextResponse.json({ success: true, user: adminUser });
      setSessionCookie(response, adminUser, req);
      return response;
    }

    // Secours : compte ADMINISTRATEUR éventuellement présent en base de données
    try {
      const dbUser = await authenticateUser(rawIdentifier, rawPassword);
      if (dbUser.role === 'ADMINISTRATEUR') {
        const response = NextResponse.json({ success: true, user: dbUser });
        setSessionCookie(response, dbUser, req);
        return response;
      }
    } catch {
      // Identifiants invalides : on renvoie un message unique ci-dessous
    }

    throw new UnauthorizedError('Identifiants administrateur invalides.');
  } catch (err) {
    return toErrorResponse(err);
  }
}
