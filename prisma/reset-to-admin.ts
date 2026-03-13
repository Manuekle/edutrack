/**
 * Script: borra todos los datos de la base de datos y deja solo usuarios con rol ADMIN.
 * Uso: pnpm exec tsx prisma/reset-to-admin.ts
 */
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Borrando todos los datos (manteniendo solo admins)...\n');

  // Orden respetando relaciones: hijos primero
  await prisma.attendance.deleteMany();
  console.log('   ✓ Attendance');
  await prisma.logbook.deleteMany();
  console.log('   ✓ Logbook');
  await prisma.class.deleteMany();
  console.log('   ✓ Class');
  await prisma.academicWeek.deleteMany();
  console.log('   ✓ AcademicWeek');
  await prisma.planning.deleteMany();
  console.log('   ✓ Planning');
  await prisma.group.deleteMany();
  console.log('   ✓ Group');
  await prisma.schedule.deleteMany();
  console.log('   ✓ Schedule');
  await prisma.report.deleteMany();
  console.log('   ✓ Report');
  await prisma.subject.deleteMany();
  console.log('   ✓ Subject');
  await prisma.room.deleteMany();
  console.log('   ✓ Room');
  await prisma.academicPeriod.deleteMany();
  console.log('   ✓ AcademicPeriod');

  // Eliminar todos los usuarios que NO son admin
  const deleted = await prisma.user.deleteMany({
    where: { role: { not: Role.ADMIN } },
  });
  console.log(`   ✓ User (eliminados ${deleted.count} no-admin)\n`);

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true, name: true, institutionalEmail: true, personalEmail: true },
  });
  console.log('👤 Usuarios admin restantes:', admins.length);
  admins.forEach(u =>
    console.log('   -', u.name ?? u.institutionalEmail ?? u.personalEmail ?? u.id)
  );
  console.log('\n✅ Base de datos resetada. Solo quedan usuarios con rol ADMIN.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
