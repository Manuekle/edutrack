import { PrismaClient } from '@prisma/client';

// Extend the PrismaClient type to include $queryRaw
interface CustomPrismaClient extends PrismaClient {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: unknown[]): Promise<T>;
}

declare global {
  var prisma: CustomPrismaClient | undefined;
}

// Evita múltiples instancias de Prisma en desarrollo
export const prisma: CustomPrismaClient =
  globalThis.prisma || (new PrismaClient() as CustomPrismaClient);

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export const db = prisma;

