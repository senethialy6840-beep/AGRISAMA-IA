import { NextRequest, NextResponse } from 'next/server';
import { connectOrCreateActor } from '@/lib/services/userService';
import { setSessionCookie } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, created } = await connectOrCreateActor({
      role: body.role,
      name: body.name,
      phone: body.phone,
      location: body.location,
      strictRole: Boolean(body.strictRole),
    });

    const response = NextResponse.json(
      { success: true, user, created },
      { status: created ? 201 : 200 }
    );
    setSessionCookie(response, user, req);
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
