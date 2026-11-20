import { NextRequest, NextResponse } from 'next/server';
import { createDemand, listDemands } from '@/lib/services/demandService';
import { requireAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const buyerId = searchParams.get('buyerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const product = searchParams.get('product') || undefined;

    const demands = await listDemands({ buyerId, status, product });
    return NextResponse.json({ success: true, count: demands.length, demands });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req, ['ADMINISTRATEUR', 'ACHETEUR']);
    const body = await req.json();
    const targetBuyerId =
      actor.role === 'ACHETEUR' ? actor.id : String(body.buyerId || '');

    const demand = await createDemand({
      buyerId: targetBuyerId,
      product: body.product,
      quantityValue: Number(body.quantityValue),
      quantityUnit: body.quantityUnit === 'TONNE' ? 'TONNE' : 'KG',
      maxPricePerKg: Number(body.maxPricePerKg),
      location: body.location,
      desiredDate: body.desiredDate,
      quality: body.quality,
    });
    return NextResponse.json({ success: true, demand }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
