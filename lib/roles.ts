// Role enum para usar en middleware y otros lugares donde no podemos importar Prisma
// Este archivo debe mantenerse sincronizado con el enum Role en prisma/schema.prisma

export enum Role {
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  ESTUDIANTE = 'ESTUDIANTE',
}

export const ROLES = Object.values(Role) as Role[];
