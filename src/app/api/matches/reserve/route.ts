import { NextRequest, NextResponse } from 'next/server';
import {
  releaseOfferReservation,
  reserveOfferForDemand,
} from '@/lib/services/offerService';
import { requireAuth } from '@/lib/auth';
import { toErrorResponse, ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const body = await req.json();
    if (!body.offerId || !body.demandId) {
      throw new ValidationError('Offre et demande requises pour effectuer une réservation.');
    }

    const offer = await reserveOfferForDemand(
      String(body.offerId),
      String(body.demandId),
      { id: actor.id, role: actor.role }
    );
    return NextResponse.json({ success: true, offer });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const actor = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const offerId = searchParams.get('offerId');
    if (!offerId) {
      throw new ValidationError('Identifiant d’offre manquant.');
    }

    const offer = await releaseOfferReservation(offerId, {
      id: actor.id,
      role: actor.role,
    });
    return NextResponse.json({ success: true, offer });
  } catch (err) {
    return toErrorResponse(err);
  }
}
