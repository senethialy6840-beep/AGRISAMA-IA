import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/services/userService';
import { setSessionCookie } from '@/lib/auth';
import { toErrorResponse, ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // L'inscription publique est strictement limitée aux rôles PRODUCTEUR et ACHETEUR
    const requestedRole = body.role;
    if (requestedRole !== 'PRODUCTEUR' && requestedRole !== 'ACHETEUR') {
      throw new ValidationError(
        'Veuillez choisir un profil Producteur ou Acheteur pour créer un compte.'
      );
    }
    if (!body.password || String(body.password).length < 6) {
      throw new ValidationError('Le mot de passe doit contenir au moins 6 caractères.');
    }

    const user = await createUser({
      role: requestedRole,
      name: body.name,
      phone: body.phone,
      location: body.location,
      organization: body.organization,
      password: String(body.password),
    });

    const response = NextResponse.json({ success: true, user }, { status: 201 });
    setSessionCookie(response, user, req);
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
