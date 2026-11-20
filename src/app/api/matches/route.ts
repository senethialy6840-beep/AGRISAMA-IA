import { NextRequest, NextResponse } from 'next/server';
import { listMatches } from '@/lib/services/matchingService';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const producerId = searchParams.get('producerId') || undefined;
    const buyerId = searchParams.get('buyerId') || undefined;
    const offerId = searchParams.get('offerId') || undefined;
    const demandId = searchParams.get('demandId') || undefined;
    const product = searchParams.get('product') || undefined;

    const matches = await listMatches({
      producerId,
      buyerId,
      offerId,
      demandId,
      product,
    });
    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
