/**
 * Script de limpieza de base de datos
 *
 * Elimina todo EXCEPTO:
 * - Subjects (microcurriculos/asignaturas)
 * - AcademicYear/AcademicPeriod (periodos académicos)
 *
 * Para ejecutar: npx tsx prisma/clean-only.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza de base de datos...\n');

  try {
    // Eliminar en orden para respear foreign keys
    console.log('  Eliminando attedances...');
    await prisma.attendance.deleteMany();

    console.log('  Eliminando logbooks...');
    await prisma.logbook.deleteMany();

    console.log('  Eliminando classes...');
    await prisma.class.deleteMany();

    console.log('  Eliminando academicWeeks...');
    await prisma.academicWeek.deleteMany();

    console.log('  Eliminando plannings...');
    await prisma.planning.deleteMany();

    console.log('  Eliminando groups...');
    await prisma.group.deleteMany();

    console.log('  Eliminando schedules...');
    await prisma.schedule.deleteMany();

    console.log('  Eliminando reports...');
    await prisma.report.deleteMany();

    console.log('  Eliminando unenrollRequests...');
    await prisma.unenrollRequest.deleteMany();

    console.log('  Eliminando users...');
    await prisma.user.deleteMany();

    console.log('  Eliminando rooms...');
    await prisma.room.deleteMany();

    console.log('  Eliminando specialRanges...');
    await prisma.specialRange.deleteMany();

    console.log('  Eliminando academicPeriods...');
    await prisma.academicPeriod.deleteMany();

    console.log('  Eliminando academicYears...');
    await prisma.academicYear.deleteMany();

    console.log('\n✅ Limpieza completada!\n');
    console.log('📋 Lo que queda en la base de datos:');
    console.log('   - Subjects (microcurriculos) - preservar');
    console.log('   - Rooms vacías');
    console.log('\n⚠️  subjects (microcurriculos) se mantiene intacto.');
    console.log('   Ты debes crear los usuarios manualmente.\n');
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
