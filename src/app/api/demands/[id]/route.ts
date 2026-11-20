import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteDemand, updateDemand } from '@/lib/services/demandService';
import { requireAuth, USER_PUBLIC_SELECT } from '@/lib/auth';
import { NotFoundError, toErrorResponse } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const demand = await prisma.demand.findUnique({
      where: { id: params.id },
      include: { buyer: { select: USER_PUBLIC_SELECT } },
    });
    if (!demand) {
      throw new NotFoundError('Demande introuvable.');
    }
    return NextResponse.json({ success: true, demand });
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
    const demand = await updateDemand(
      params.id,
      {
        product: body.product,
        quantityValue: body.quantityValue,
        quantityUnit: body.quantityUnit,
        maxPricePerKg: body.maxPricePerKg,
        location: body.location,
        desiredDate: body.desiredDate,
        quality: body.quality,
        status: body.status,
      },
      { id: actor.id, role: actor.role }
    );
    return NextResponse.json({ success: true, demand });
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
    await deleteDemand(params.id, { id: actor.id, role: actor.role });
    return NextResponse.json({ success: true });
  } catch (err) {
    return toErrorResponse(err);
  }
}
