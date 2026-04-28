/**
 * Seed para crear el año académico 2026 y el primer periodo
 *Ejecutar: npx tsx prisma/seed-periods.ts
 */

import { PrismaClient, SpecialType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAcademicYear() {
  console.log('📅 Creando año académico 2026...\n');

  try {
    // 1. Crear AcademicYear 2026
    const academicYear = await prisma.academicYear.upsert({
      where: { year: 2026 },
      update: {},
      create: {
        year: 2026,
        isActive: true,
      },
    });

    console.log(`✅ Año académico: ${academicYear.year}`);

    // 2. Crear periodo 2026-1 (10 feb - 13 jun)
    const period2026_1 = await prisma.academicPeriod.upsert({
      where: { name: '2026-1' },
      update: {},
      create: {
        name: '2026-1',
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-06-13'),
        isActive: true,
        yearId: academicYear.id,
      },
    });

    console.log(`✅ Periodo: ${period2026_1.name}`);
    console.log(`   📆 Inicio: ${period2026_1.startDate.toLocaleDateString('es-CO')}`);
    console.log(`   📆 Fin: ${period2026_1.endDate.toLocaleDateString('es-CO')}`);

    console.log('\n✅ Periodos académicos configurados!');
    console.log('\n📌 Nota: El segundo periodo (2026-2) aún no está publicado.');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAcademicYear();
