import test from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from '../src/lib/auth';
import {
  authenticateUser,
  createUser,
  getUserById,
  listUsers,
} from '../src/lib/services/userService';
import {
  createOffer,
  deleteOffer,
  releaseOfferReservation,
  reserveOfferForDemand,
  updateOffer,
} from '../src/lib/services/offerService';
import {
  createDemand,
  deleteDemand,
  updateDemand,
} from '../src/lib/services/demandService';
import { listMatches } from '../src/lib/services/matchingService';

test('AgriSama IA Full-Stack — Authentification, RBAC, Validation et Réservations', async (t) => {
  const createdUserIds: string[] = [];
  const createdOfferIds: string[] = [];
  const createdDemandIds: string[] = [];

  await t.test('1. Hachage scrypt et jetons de session HMAC-SHA256', () => {
    const hash = hashPassword('monMotDePasse2026');
    assert.ok(hash.includes(':'));
    assert.equal(verifyPassword('monMotDePasse2026', hash), true);
    assert.equal(verifyPassword('mauvaisMotDePasse', hash), false);
    assert.equal(verifyPassword('x', null), false);

    const token = signSessionToken({
      userId: 'user-123',
      role: 'PRODUCTEUR',
      exp: Date.now() + 60_000,
    });
    const decoded = verifySessionToken(token);
    assert.ok(decoded);
    assert.equal(decoded?.userId, 'user-123');
    assert.equal(decoded?.role, 'PRODUCTEUR');

    // Altération de signature -> rejeté
    const tampered = `${token.split('.')[0]}.invalidsignature`;
    assert.equal(verifySessionToken(tampered), null);

    // Jeton expiré -> rejeté
    const expired = signSessionToken({
      userId: 'user-123',
      role: 'PRODUCTEUR',
      exp: Date.now() - 1000,
    });
    assert.equal(verifySessionToken(expired), null);
  });

  await t.test('2. Création de compte sécurisée, authentification et protection des empreintes', async () => {
    const suffix = Math.floor(100000 + Math.random() * 899999);
    const phone = `+221 77 ${String(suffix).slice(0, 3)} ${String(suffix).slice(3, 5)} 99`;

    const producer = await createUser({
      role: 'PRODUCTEUR',
      name: 'Cheikh Fall Test',
      phone,
      location: 'Mboro (Niayes)',
      organization: 'Ferme Test Mboro',
      password: 'SecretPassword123',
    });
    createdUserIds.push(producer.id);

    // Aucune fuite de passwordHash dans les retours publics
    assert.equal('passwordHash' in producer, false);

    const fetched = await getUserById(producer.id);
    assert.ok(fetched);
    assert.equal('passwordHash' in fetched, false);

    const all = await listUsers('PRODUCTEUR');
    assert.ok(all.every((u) => !('passwordHash' in u)));

    // Connexion réussie avec format exact ou sans espaces
    const authExact = await authenticateUser(phone, 'SecretPassword123');
    assert.equal(authExact.id, producer.id);

    const compactPhone = phone.replace(/\s+/g, '');
    const authCompact = await authenticateUser(compactPhone, 'SecretPassword123');
    assert.equal(authCompact.id, producer.id);

    // Mauvais mot de passe rejeté
    await assert.rejects(
      async () => authenticateUser(phone, 'wrong-pass'),
      /incorrect/i
    );
  });

  await t.test('3. Réservation atomique sur correspondance, blocage de double réservation et annulation', async () => {
    const rand1 = Math.floor(100 + Math.random() * 899);
    const rand2 = Math.floor(100 + Math.random() * 899);

    const producer = await createUser({
      role: 'PRODUCTEUR',
      name: 'Producteur Réservation',
      phone: `+221 77 ${rand1} 44 11`,
      location: 'Notto Gouye Diama (Niayes)',
      password: 'password123',
    });
    createdUserIds.push(producer.id);

    const buyer = await createUser({
      role: 'ACHETEUR',
      name: 'Acheteur Réservation',
      phone: `+221 78 ${rand2} 55 22`,
      location: 'Dakar — Marché Castor',
      password: 'password123',
    });
    createdUserIds.push(buyer.id);

    const outsider = await createUser({
      role: 'ACHETEUR',
      name: 'Acheteur Tiers',
      phone: `+221 76 ${rand1} 66 33`,
      location: 'Thiès — Marché Central',
      password: 'password123',
    });
    createdUserIds.push(outsider.id);

    const offer = await createOffer({
      producerId: producer.id,
      product: 'Oignon Violet de Galmi',
      quantityValue: 5,
      quantityUnit: 'TONNE',
      pricePerKg: 370,
      location: 'Notto Gouye Diama (Niayes)',
      availableDate: '2026-11-20',
      quality: 'Catégorie 1',
    });
    createdOfferIds.push(offer.id);

    const demand = await createDemand({
      buyerId: buyer.id,
      product: 'Oignon Violet de Galmi',
      quantityValue: 4,
      quantityUnit: 'TONNE',
      maxPricePerKg: 390,
      location: 'Dakar — Marché Castor',
      desiredDate: '2026-11-22',
      quality: 'Catégorie 1',
    });
    createdDemandIds.push(demand.id);

    // Un acheteur tiers ne peut pas réserver pour la demande d'un autre
    await assert.rejects(
      async () =>
        reserveOfferForDemand(offer.id, demand.id, {
          id: outsider.id,
          role: 'ACHETEUR',
        }),
      /Seul l’acheteur concerné/i
    );

    // L'acheteur légitime réserve l'offre
    const reserved = await reserveOfferForDemand(offer.id, demand.id, {
      id: buyer.id,
      role: 'ACHETEUR',
    });
    assert.equal(reserved.status, 'RESERVEE');
    assert.equal(reserved.reservedForDemandId, demand.id);
    assert.equal(reserved.reservedByUserId, buyer.id);

    // L'offre réservée sort des correspondances disponibles
    const activeMatchesAfterReserve = await listMatches({ offerId: offer.id });
    assert.equal(activeMatchesAfterReserve.length, 0);

    // Impossible de réserver une seconde fois
    await assert.rejects(
      async () =>
        reserveOfferForDemand(offer.id, demand.id, {
          id: buyer.id,
          role: 'ACHETEUR',
        }),
      /plus disponible/i
    );

    // Annulation de réservation par le producteur -> offre redevient DISPONIBLE et retrouve sa correspondance
    const released = await releaseOfferReservation(offer.id, {
      id: producer.id,
      role: 'PRODUCTEUR',
    });
    assert.equal(released.status, 'DISPONIBLE');
    assert.equal(released.reservedForDemandId, null);

    const matchesAfterRelease = await listMatches({
      offerId: offer.id,
      demandId: demand.id,
    });
    assert.equal(matchesAfterRelease.length, 1);

    // Validation stricte : uniquement l'oignon autorisé sur la plateforme
    await assert.rejects(
      async () =>
        createOffer({
          producerId: producer.id,
          product: 'Pomme de terre',
          quantityValue: 2,
          quantityUnit: 'TONNE',
          pricePerKg: 400,
          location: 'Mboro (Niayes)',
          availableDate: '2026-11-20',
          quality: 'Catégorie 1',
        }),
      /exclusivement dédiée à l’oignon/i
    );

    await assert.rejects(
      async () =>
        createDemand({
          buyerId: buyer.id,
          product: 'Tomate',
          quantityValue: 1000,
          quantityUnit: 'KG',
          maxPricePerKg: 350,
          location: 'Dakar — Marché Castor',
          desiredDate: '2026-11-22',
          quality: 'Standard',
        }),
      /exclusivement dédiée à l’oignon/i
    );

    // Validation stricte lors des mises à jour
    await assert.rejects(
      async () =>
        updateOffer(
          offer.id,
          { pricePerKg: -100 },
          { id: producer.id, role: 'PRODUCTEUR' }
        ),
      /supérieur à zéro/i
    );

    await assert.rejects(
      async () =>
        updateDemand(
          demand.id,
          { maxPricePerKg: 0 },
          { id: buyer.id, role: 'ACHETEUR' }
        ),
      /positif/i
    );

    // Suppression protégée : seul le propriétaire ou admin peut supprimer
    await assert.rejects(
      async () => deleteOffer(offer.id, { id: outsider.id, role: 'ACHETEUR' }),
      /propres offres/i
    );
    await assert.rejects(
      async () => deleteDemand(demand.id, { id: outsider.id, role: 'ACHETEUR' }),
      /propres demandes/i
    );

    await deleteOffer(offer.id, { id: producer.id, role: 'PRODUCTEUR' });
    await deleteDemand(demand.id, { id: buyer.id, role: 'ACHETEUR' });
  });

  t.after(async () => {
    if (createdOfferIds.length > 0) {
      await prisma.offer.deleteMany({ where: { id: { in: createdOfferIds } } });
    }
    if (createdDemandIds.length > 0) {
      await prisma.demand.deleteMany({ where: { id: { in: createdDemandIds } } });
    }
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await prisma.$disconnect();
  });
});
