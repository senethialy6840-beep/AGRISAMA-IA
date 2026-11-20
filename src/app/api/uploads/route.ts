import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ValidationError, toErrorResponse } from '@/lib/errors';
import {
  getSupabaseServerClient,
  SUPABASE_MEDIA_BUCKET,
} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function POST(req: NextRequest) {
  try {
    const actor = await requireAuth(req, ['PRODUCTEUR', 'ADMINISTRATEUR']);
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      throw new ValidationError('Veuillez sélectionner une image valide.');
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      throw new ValidationError('Format non pris en charge (JPG, PNG ou WebP uniquement).');
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError('La taille de l’image doit être inférieure à 5 Mo.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = `lots/${actor.id}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .upload(safeName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur Supabase Storage : ${error.message}`);
    }

    const { data } = supabase.storage
      .from(SUPABASE_MEDIA_BUCKET)
      .getPublicUrl(safeName);

    return NextResponse.json(
      {
        success: true,
        url: data.publicUrl,
        path: safeName,
      },
      { status: 201 }
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
