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
  await prisma.enrollment.deleteMany();
  console.log('   ✓ Enrollment');
  await prisma.groupAssignment.deleteMany();
  console.log('   ✓ GroupAssignment');
  await prisma.class.deleteMany();
  console.log('   ✓ Class');
  await prisma.subjectEvent.deleteMany();
  console.log('   ✓ SubjectEvent');
  await prisma.report.deleteMany();
  console.log('   ✓ Report');
  await prisma.unenrollRequest.deleteMany();
  console.log('   ✓ UnenrollRequest');
  await prisma.subjectContent.deleteMany();
  console.log('   ✓ SubjectContent');
  await prisma.subject.deleteMany();
  console.log('   ✓ Subject');
  await prisma.roomBooking.deleteMany();
  console.log('   ✓ RoomBooking');
  await prisma.room.deleteMany();
  console.log('   ✓ Room');

  // Eliminar todos los usuarios que NO son admin
  const deleted = await prisma.user.deleteMany({
    where: { role: { not: Role.ADMIN } },
  });
  console.log(`   ✓ User (eliminados ${deleted.count} no-admin)\n`);

  const admins = await prisma.user.findMany({
    where: { role: Role.ADMIN },
    select: { id: true, name: true, correoInstitucional: true, correoPersonal: true },
  });
  console.log('👤 Usuarios admin restantes:', admins.length);
  admins.forEach(u =>
    console.log('   -', u.name ?? u.correoInstitucional ?? u.correoPersonal ?? u.id)
  );
  console.log('\n✅ Base de datos resetada. Solo quedan usuarios con rol ADMIN.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
