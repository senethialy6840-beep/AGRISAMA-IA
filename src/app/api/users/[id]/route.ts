import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/services/userService';
import { requireAuth } from '@/lib/auth';
import { NotFoundError, toErrorResponse } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const user = await getUserById(params.id);
    if (!user) {
      throw new NotFoundError('Utilisateur introuvable.');
    }
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    const updated = await updateUser(
      params.id,
      {
        name: body.name,
        phone: body.phone,
        location: body.location,
        organization: body.organization,
      },
      { id: actor.id, role: actor.role }
    );
    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    return toErrorResponse(err);
  }
}
