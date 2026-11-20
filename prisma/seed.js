const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Initialisation de la base de donnees AgriSama IA...');
  const defaultDemoPasswordHash = hashPassword('agrisama2026');

  // 1. Profils utilisateurs : Administrateur, Producteurs (zone des Niayes) et Acheteurs
  const usersData = [
    {
      role: 'ADMINISTRATEUR',
      name: 'Ibrahima Sarr',
      phone: '+221 77 900 10 00',
      location: 'Dakar — Marché Castor',
      organization: 'Direction AgriSama IA',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'PRODUCTEUR',
      name: 'Modou Ndiaye',
      phone: '+221 77 110 22 33',
      location: 'Mboro (Niayes)',
      organization: 'Exploitation Maraîchère de Mboro',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'PRODUCTEUR',
      name: 'Ousseynou Diouf',
      phone: '+221 77 220 33 44',
      location: 'Notto Gouye Diama (Niayes)',
      organization: 'Union des Producteurs de Notto',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'PRODUCTEUR',
      name: 'Awa Seck',
      phone: '+221 77 330 44 55',
      location: 'Potou (Niayes)',
      organization: 'Coopérative Agricole de Potou',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'ACHETEUR',
      name: 'Mamadou Fall',
      phone: '+221 78 440 55 66',
      location: 'Dakar — Marché Thiaroye',
      organization: 'Établissements Fall & Frères (Grossiste)',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'ACHETEUR',
      name: 'Fatou Binetou Diop',
      phone: '+221 78 550 66 77',
      location: 'Thiès — Marché Central',
      organization: 'Société Diop Distribution',
      passwordHash: defaultDemoPasswordHash,
    },
    {
      role: 'ACHETEUR',
      name: 'Cheikh Tidiane Sylla',
      phone: '+221 76 660 77 88',
      location: 'Touba — Marché Ocass',
      organization: 'Centrale d’Achat Touba',
      passwordHash: defaultDemoPasswordHash,
    },
  ];

  const userMap = {};
  for (const u of usersData) {
    const saved = await prisma.user.upsert({
      where: { phone: u.phone },
      update: u,
      create: u,
    });
    userMap[u.phone] = saved;
  }

  // 2. Offres de récolte initiales
  const existingOffers = await prisma.offer.count();
  if (existingOffers === 0) {
    await prisma.offer.createMany({
      data: [
        {
          producerId: userMap['+221 77 110 22 33'].id,
          product: 'Oignon Violet de Galmi',
          quantityValue: 5,
          quantityUnit: 'TONNE',
          quantityKg: 5000,
          pricePerKg: 380,
          location: 'Mboro (Niayes)',
          availableDate: new Date('2026-11-18'),
          quality: 'Catégorie 1',
          status: 'DISPONIBLE',
        },
        {
          producerId: userMap['+221 77 220 33 44'].id,
          product: 'Oignon Yaakaar',
          quantityValue: 3500,
          quantityUnit: 'KG',
          quantityKg: 3500,
          pricePerKg: 360,
          location: 'Notto Gouye Diama (Niayes)',
          availableDate: new Date('2026-11-19'),
          quality: 'Catégorie 1',
          status: 'DISPONIBLE',
        },
        {
          producerId: userMap['+221 77 330 44 55'].id,
          product: 'Oignon Violet de Galmi',
          quantityValue: 8,
          quantityUnit: 'TONNE',
          quantityKg: 8000,
          pricePerKg: 375,
          location: 'Potou (Niayes)',
          availableDate: new Date('2026-11-20'),
          quality: 'Standard',
          status: 'DISPONIBLE',
        },
        {
          producerId: userMap['+221 77 110 22 33'].id,
          product: 'Oignon Blanc',
          quantityValue: 2000,
          quantityUnit: 'KG',
          quantityKg: 2000,
          pricePerKg: 400,
          location: 'Mboro (Niayes)',
          availableDate: new Date('2026-11-21'),
          quality: 'Catégorie 1',
          status: 'RESERVEE',
        },
      ],
    });
  }

  // 3. Demandes d'achat initiales
  const existingDemands = await prisma.demand.count();
  if (existingDemands === 0) {
    await prisma.demand.createMany({
      data: [
        {
          buyerId: userMap['+221 78 440 55 66'].id,
          product: 'Oignon Violet de Galmi',
          quantityValue: 4,
          quantityUnit: 'TONNE',
          quantityKg: 4000,
          maxPricePerKg: 400,
          location: 'Dakar — Marché Thiaroye',
          desiredDate: new Date('2026-11-22'),
          quality: 'Catégorie 1',
          status: 'ACTIVE',
        },
        {
          buyerId: userMap['+221 78 550 66 77'].id,
          product: 'Oignon Yaakaar',
          quantityValue: 3000,
          quantityUnit: 'KG',
          quantityKg: 3000,
          maxPricePerKg: 380,
          location: 'Thiès — Marché Central',
          desiredDate: new Date('2026-11-21'),
          quality: 'Catégorie 1',
          status: 'ACTIVE',
        },
        {
          buyerId: userMap['+221 76 660 77 88'].id,
          product: 'Oignon Violet de Galmi',
          quantityValue: 6,
          quantityUnit: 'TONNE',
          quantityKg: 6000,
          maxPricePerKg: 390,
          location: 'Touba — Marché Ocass',
          desiredDate: new Date('2026-11-25'),
          quality: 'Standard',
          status: 'ACTIVE',
        },
      ],
    });
  }

  console.log('Base de donnees AgriSama IA initialisee avec succes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
