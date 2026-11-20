import { NextRequest, NextResponse } from 'next/server';
import { listUsers, createUser } from '@/lib/services/userService';
import { requireAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') as any;
    const users = await listUsers(role || undefined);
    return NextResponse.json({ success: true, count: users.length, users });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Seul un administrateur authentifié peut créer un utilisateur depuis la gestion d'annuaire
    await requireAuth(req, ['ADMINISTRATEUR']);
    const body = await req.json();
    const user = await createUser({
      role: body.role,
      name: body.name,
      phone: body.phone,
      location: body.location,
      organization: body.organization,
      password: body.password || 'agrisama2026',
    });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
