import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    return toErrorResponse(err);
  }
}
