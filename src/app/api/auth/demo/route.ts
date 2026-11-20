import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, USER_PUBLIC_SELECT } from '@/lib/auth';
import { NotFoundError, toErrorResponse, ValidationError } from '@/lib/errors';

const DEMO_PHONES = [
  '+221 77 900 10 00', // Admin
  '+221 77 110 22 33', // Producteur
  '+221 78 440 55 66', // Acheteur
];

export async function GET() {
  try {
    const demoUsers = await prisma.user.findMany({
      where: { phone: { in: DEMO_PHONES } },
      select: USER_PUBLIC_SELECT,
      orderBy: { role: 'asc' },
    });
    return NextResponse.json({ success: true, demoUsers });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let user = null;

    if (body.userId) {
      user = await prisma.user.findUnique({
        where: { id: String(body.userId) },
        select: USER_PUBLIC_SELECT,
      });
    } else if (body.role && ['ADMINISTRATEUR', 'PRODUCTEUR', 'ACHETEUR'].includes(body.role)) {
      user = await prisma.user.findFirst({
        where: { role: body.role },
        select: USER_PUBLIC_SELECT,
        orderBy: { createdAt: 'asc' },
      });
    } else {
      throw new ValidationError('Paramètre de démonstration invalide.');
    }

    if (!user) {
      throw new NotFoundError('Profil de démonstration introuvable.');
    }

    const response = NextResponse.json({ success: true, user });
    setSessionCookie(response, user, req);
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
