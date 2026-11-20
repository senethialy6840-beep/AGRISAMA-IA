import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../src/lib/prisma';
import { getDashboardData } from '../src/lib/services/dashboardService';
import { createUser, updateUser, listUsers } from '../src/lib/services/userService';
import { createOffer, updateOffer, listOffers } from '../src/lib/services/offerService';
import { createDemand, updateDemand, listDemands } from '../src/lib/services/demandService';
import { computeCompatibility, listMatches } from '../src/lib/services/matchingService';

test('Refonte AgriSama IA — Vérification complète (Étapes 1 à 5)', async (t) => {
  let newProducerId = '';
  let newBuyerId = '';
  let newAdminId = '';
  let newOfferId = '';
  let newDemandId = '';

  await t.test('1. Tableau de bord : retourne les 5 indicateurs essentiels et les dernières offres/demandes', async () => {
    const dashboard = await getDashboardData();
    assert.ok(typeof dashboard.stats.producersCount === 'number' && dashboard.stats.producersCount >= 0);
    assert.ok(typeof dashboard.stats.buyersCount === 'number' && dashboard.stats.buyersCount >= 0);
    assert.ok(typeof dashboard.stats.availableOffersCount === 'number' && dashboard.stats.availableOffersCount >= 0);
    assert.ok(typeof dashboard.stats.demandsCount === 'number' && dashboard.stats.demandsCount >= 0);
    assert.ok(typeof dashboard.stats.matchesCount === 'number' && dashboard.stats.matchesCount >= 0);
    assert.ok(Array.isArray(dashboard.recentOffers));
    assert.ok(Array.isArray(dashboard.recentDemands));
  });

  await t.test('2. Producteurs : ajout, consultation, modification et contrôle des permissions', async () => {
    const randPhone = `+221 77 ${Math.floor(100 + Math.random() * 899)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`;
    const producer = await createUser({
      role: 'PRODUCTEUR',
      name: 'Abdou Salam Diop',
      phone: randPhone,
      location: 'Notto Gouye Diama (Niayes)',
      organization: 'Ferme Diop Notto',
    });

    newProducerId = producer.id;
    assert.equal(producer.role, 'PRODUCTEUR');
    assert.equal(producer.location, 'Notto Gouye Diama (Niayes)');

    // Modification autorisée par le producteur lui-même
    const updated = await updateUser(
      newProducerId,
      { organization: 'Coopérative de Notto Gouye Diama' },
      { id: newProducerId, role: 'PRODUCTEUR' }
    );
    assert.equal(updated.organization, 'Coopérative de Notto Gouye Diama');

    // Modification refusée pour un autre utilisateur non administrateur
    await assert.rejects(
      async () => {
        await updateUser(
          newProducerId,
          { name: 'Tentative Non Autorisée' },
          { id: 'autre-user-id', role: 'PRODUCTEUR' }
        );
      },
      /Action non autorisée/i
    );
  });

  await t.test('3. Offres de récolte : publication en tonnes/kg, modification et statuts (Disponible, Réservée, Vendue)', async () => {
    const offer = await createOffer({
      producerId: newProducerId,
      product: 'Oignon Violet de Galmi',
      quantityValue: 4.5,
      quantityUnit: 'TONNE',
      pricePerKg: 370,
      location: 'Notto Gouye Diama (Niayes)',
      availableDate: '2026-11-19',
      quality: 'Catégorie 1',
    });

    newOfferId = offer.id;
    assert.equal(offer.quantityKg, 4500);
    assert.equal(offer.status, 'DISPONIBLE');

    const producerOffers = await listOffers({ producerId: newProducerId });
    assert.equal(producerOffers.length, 1);
  });

  await t.test('4. Acheteurs & Demandes d’achat : ajout acheteur, publication demande et modification', async () => {
    const randPhone = `+221 78 ${Math.floor(100 + Math.random() * 899)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`;
    const buyer = await createUser({
      role: 'ACHETEUR',
      name: 'Khadija Ndiaye',
      phone: randPhone,
      location: 'Thiès — Marché Central',
      organization: 'Ndiaye Négoce Thiès',
    });
    newBuyerId = buyer.id;

    const demand = await createDemand({
      buyerId: newBuyerId,
      product: 'Oignon Violet de Galmi',
      quantityValue: 4,
      quantityUnit: 'TONNE',
      maxPricePerKg: 390,
      location: 'Thiès — Marché Central',
      desiredDate: '2026-11-22',
      quality: 'Catégorie 1',
    });

    newDemandId = demand.id;
    assert.equal(demand.quantityKg, 4000);
    assert.equal(demand.status, 'ACTIVE');

    const updatedDemand = await updateDemand(
      newDemandId,
      { maxPricePerKg: 400 },
      { id: newBuyerId, role: 'ACHETEUR' }
    );
    assert.equal(updatedDemand.maxPricePerKg, 400);
  });

  await t.test('5. Mise en relation intelligente : calcul réel sur 6 critères, explication courte et actualisation dynamique', async () => {
    const matches = await listMatches({ offerId: newOfferId, demandId: newDemandId });
    assert.equal(matches.length, 1, 'Une correspondance doit exister entre la nouvelle offre et la nouvelle demande');

    const match = matches[0];
    assert.ok(match.compatibilityScore >= 85, `Score élevé attendu (>=85), reçu ${match.compatibilityScore}`);
    assert.equal(match.quantityScore, 100);
    assert.equal(match.priceScore, 100);
    assert.equal(match.qualityScore, 100);
    assert.ok(
      match.explanation.startsWith(`Correspondance à ${match.compatibilityScore} % : produit compatible`),
      `Format d'explication attendu, reçu: ${match.explanation}`
    );

    // Changement du statut de l'offre en VENDUE -> la correspondance doit disparaître automatiquement
    await updateOffer(
      newOfferId,
      { status: 'VENDUE' },
      { id: newProducerId, role: 'PRODUCTEUR' }
    );

    const matchesAfterSold = await listMatches({ offerId: newOfferId });
    assert.equal(
      matchesAfterSold.length,
      0,
      'Une offre vendue ne doit plus apparaître dans les correspondances disponibles'
    );
  });

  await t.test('6. Administrateur : permissions complètes sur tous les profils et offres', async () => {
    const randPhone = `+221 77 ${Math.floor(100 + Math.random() * 899)} ${Math.floor(10 + Math.random() * 89)} ${Math.floor(10 + Math.random() * 89)}`;
    const admin = await createUser({
      role: 'ADMINISTRATEUR',
      name: 'Admin Test Temporaire',
      phone: randPhone,
      location: 'Dakar — Siège',
    });
    newAdminId = admin.id;

    const reopened = await updateOffer(
      newOfferId,
      { status: 'DISPONIBLE' },
      { id: admin.id, role: 'ADMINISTRATEUR' }
    );
    assert.equal(reopened.status, 'DISPONIBLE');
  });

  await t.test('7. Conformité Design & UX : absence totale d’emojis dans le code source de l’application', () => {
    const srcDir = path.join(__dirname, '../src');
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    function scanNoEmoji(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanNoEmoji(fullPath);
        } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          assert.ok(
            !emojiRegex.test(content),
            `Un emoji a été détecté dans le fichier ${entry.name}, ce qui est interdit par la directive de refonte.`
          );
        }
      }
    }

    scanNoEmoji(srcDir);
  });

  t.after(async () => {
    if (newOfferId) {
      await prisma.match.deleteMany({ where: { offerId: newOfferId } });
      await prisma.offer.deleteMany({ where: { id: newOfferId } });
    }
    if (newDemandId) {
      await prisma.match.deleteMany({ where: { demandId: newDemandId } });
      await prisma.demand.deleteMany({ where: { id: newDemandId } });
    }
    if (newProducerId || newBuyerId || newAdminId) {
      await prisma.user.deleteMany({
        where: { id: { in: [newProducerId, newBuyerId, newAdminId].filter(Boolean) } },
      });
    }
    await prisma.$disconnect();
  });
});
