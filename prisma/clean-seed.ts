import { PrismaClient, Role, RoomType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('admin123', 12);

  console.log('🗑️  Wiping database...');
  // Delete in order to satisfy foreign key constraints if they existed
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.groupAssignment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.bitacora.deleteMany();
  await prisma.semanaAcademica.deleteMany();
  await prisma.planeacion.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.horario.deleteMany();
  await prisma.subjectEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.unenrollRequest.deleteMany();
  await prisma.subjectContent.deleteMany();
  await prisma.microcurriculo.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.roomBooking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Creating 1 Admin...');
  await prisma.user.create({
    data: {
      name: 'Admin Principal',
      document: 'ADMIN001',
      correoInstitucional: 'admin@test.com',
      correoPersonal: 'admin.p@test.com',
      password,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('👤 Creating 2 Teachers...');
  for (let i = 1; i <= 2; i++) {
    await prisma.user.create({
      data: {
        name: `Docente ${i}`,
        document: `DOC00${i}`,
        correoInstitucional: `docente${i}@test.com`,
        correoPersonal: `docente${i}.p@test.com`,
        password,
        role: Role.DOCENTE,
        isActive: true,
      },
    });
  }

  console.log('👤 Creating 10 Students...');
  for (let i = 1; i <= 10; i++) {
    await prisma.user.create({
      data: {
        name: `Estudiante ${i}`,
        document: `EST00${i}`,
        correoInstitucional: `estudiante${i}@test.com`,
        correoPersonal: `estudiante${i}.p@test.com`,
        password,
        role: Role.ESTUDIANTE,
        isActive: true,
        codigoEstudiantil: `COD${i.toString().padStart(3, '0')}`,
      },
    });
  }

  console.log('🏫 Creating Rooms...');
  // 3 salas (SALA_COMPUTO)
  for (let i = 1; i <= 3; i++) {
    await prisma.room.create({
      data: {
        name: `Sala de Cómputo ${i}`,
        type: RoomType.SALA_COMPUTO,
        capacity: 20,
      },
    });
  }
  // 2 salones (SALON)
  for (let i = 1; i <= 2; i++) {
    await prisma.room.create({
      data: {
        name: `Salón ${i}`,
        type: RoomType.SALON,
        capacity: 35,
      },
    });
  }
  // 1 auditorio (AUDITORIO)
  await prisma.room.create({
    data: {
      name: 'Auditorio Principal',
      type: RoomType.AUDITORIO,
      capacity: 100,
    },
  });

  console.log('✅ Database reset and seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
