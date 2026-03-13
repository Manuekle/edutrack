import { PrismaClient, Role, RoomType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('admin123', 12);

  console.log('🗑️  Wiping database...');
  // Delete in order to satisfy foreign key constraints if they existed
  await prisma.attendance.deleteMany();
  await prisma.logbook.deleteMany();
  await prisma.class.deleteMany();
  await prisma.academicWeek.deleteMany();
  await prisma.planning.deleteMany();
  await prisma.group.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.report.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academicPeriod.deleteMany();

  console.log('👤 Creating 1 Admin...');
  await prisma.user.create({
    data: {
      name: 'Admin Principal',
      document: 'ADMIN001',
      institutionalEmail: 'admin@test.com',
      personalEmail: 'admin.p@test.com',
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
        institutionalEmail: `docente${i}@test.com`,
        personalEmail: `docente${i}.p@test.com`,
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
        institutionalEmail: `estudiante${i}@test.com`,
        personalEmail: `estudiante${i}.p@test.com`,
        password,
        role: Role.ESTUDIANTE,
        isActive: true,
        studentCode: `COD${i.toString().padStart(3, '0')}`,
      },
    });
  }

  console.log('🏫 Creating Rooms...');
  // 3 salas (LABORATORIO)
  for (let i = 1; i <= 3; i++) {
    await prisma.room.create({
      data: {
        name: `Laboratorio ${i}`,
        type: RoomType.LABORATORIO,
        capacity: 20,
      },
    });
  }
  // 2 salones (SALA_CLASE)
  for (let i = 1; i <= 2; i++) {
    await prisma.room.create({
      data: {
        name: `Salón ${i}`,
        type: RoomType.SALA_CLASE,
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
