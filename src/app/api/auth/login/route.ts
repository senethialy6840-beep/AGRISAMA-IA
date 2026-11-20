import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services/userService';
import { setSessionCookie } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await authenticateUser(body.phone, body.password);
    const response = NextResponse.json({ success: true, user });
    setSessionCookie(response, user, req);
    return response;
  } catch (err) {
    return toErrorResponse(err);
  }
}
