import { NextRequest, NextResponse } from 'next/server';
import { createOffer, listOffers } from '@/lib/services/offerService';
import { requireAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const producerId = searchParams.get('producerId') || undefined;
    const status = searchParams.get('status') || undefined;
    const product = searchParams.get('product') || undefined;
    const reservedByOrForBuyerId = searchParams.get('reservedByOrForBuyerId') || undefined;

    const offers = await listOffers({
      producerId,
      status,
      product,
      reservedByOrForBuyerId,
    });
    return NextResponse.json({ success: true, count: offers.length, offers });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req, ['ADMINISTRATEUR', 'PRODUCTEUR']);
    const body = await req.json();
    const targetProducerId =
      actor.role === 'PRODUCTEUR' ? actor.id : String(body.producerId || '');

    const offer = await createOffer({
      producerId: targetProducerId,
      product: body.product,
      quantityValue: Number(body.quantityValue),
      quantityUnit: body.quantityUnit === 'TONNE' ? 'TONNE' : 'KG',
      pricePerKg: Number(body.pricePerKg),
      location: body.location,
      availableDate: body.availableDate,
      quality: body.quality,
      status: body.status,
      imageUrl: body.imageUrl,
    });
    return NextResponse.json({ success: true, offer }, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
