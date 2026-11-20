import { prisma } from '../prisma';
import { syncAllMatches } from './matchingService';
import { USER_PUBLIC_SELECT } from '../auth';

export async function getDashboardData() {
  await syncAllMatches();

  const [
    producersCount,
    buyersCount,
    availableOffersCount,
    demandsCount,
    matchesCount,
    reservedOffersCount,
    recentOffers,
    recentDemands,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'PRODUCTEUR' } }),
    prisma.user.count({ where: { role: 'ACHETEUR' } }),
    prisma.offer.count({ where: { status: 'DISPONIBLE' } }),
    prisma.demand.count({ where: { status: 'ACTIVE' } }),
    prisma.match.count(),
    prisma.offer.count({ where: { status: 'RESERVEE' } }),
    prisma.offer.findMany({
      include: { producer: { select: USER_PUBLIC_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.demand.findMany({
      include: { buyer: { select: USER_PUBLIC_SELECT } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    stats: {
      producersCount,
      buyersCount,
      availableOffersCount,
      demandsCount,
      matchesCount,
      reservedOffersCount,
    },
    recentOffers,
    recentDemands,
  };
}
