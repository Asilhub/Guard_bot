import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

type LoggedPrisma = PrismaClient<{
  log: [
    { emit: 'event'; level: 'query' },
    { emit: 'event'; level: 'error' },
    { emit: 'event'; level: 'warn' },
  ];
}>;

const globalForPrisma = globalThis as unknown as { prisma: LoggedPrisma };

export const prisma: LoggedPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

prisma.$on('error', (e: Prisma.LogEvent) => {
  logger.error('Prisma error', e);
});

prisma.$on('warn', (e: Prisma.LogEvent) => {
  logger.warn('Prisma warn', e);
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
