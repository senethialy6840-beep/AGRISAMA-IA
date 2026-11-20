import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/services/dashboardService';
import { requireAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req, ['ADMINISTRATEUR']);
    const data = await getDashboardData();
    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return toErrorResponse(err);
  }
}
