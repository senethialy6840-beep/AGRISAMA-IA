import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteOffer, updateOffer } from '@/lib/services/offerService';
import { requireAuth, USER_PUBLIC_SELECT } from '@/lib/auth';
import { NotFoundError, toErrorResponse } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: { producer: { select: USER_PUBLIC_SELECT } },
    });
    if (!offer) {
      throw new NotFoundError('Offre introuvable.');
    }
    return NextResponse.json({ success: true, offer });
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
    const offer = await updateOffer(
      params.id,
      {
        product: body.product,
        quantityValue: body.quantityValue,
        quantityUnit: body.quantityUnit,
        pricePerKg: body.pricePerKg,
        location: body.location,
        availableDate: body.availableDate,
        quality: body.quality,
        status: body.status,
        imageUrl: body.imageUrl,
      },
      { id: actor.id, role: actor.role }
    );
    return NextResponse.json({ success: true, offer });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const actor = await requireAuth(req);
    await deleteOffer(params.id, { id: actor.id, role: actor.role });
    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
