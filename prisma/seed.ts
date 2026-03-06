import { EnrollmentStatus, Jornada, PrismaClient, Role, RoomType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => hash(password, 12);

async function main() {
  console.log('🗑️  Limpiando base de datos...');
  
  // Limpieza en orden de dependencias
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.groupAssignment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subjectEvent.deleteMany();
  await prisma.report.deleteMany();
  await prisma.unenrollRequest.deleteMany();
  await prisma.subjectContent.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.roomBooking.deleteMany();
  await prisma.room.deleteMany();
  
  // Limpiar usuarios excepto el admin principal si se desea conservar, 
  // pero aquí recreamos todo para un entorno límpio.
  await prisma.user.deleteMany();

  console.log('👤 Creando usuarios...');
  const commonPassword = await hashPassword('password123');

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Sistema',
      document: '1000',
      correoInstitucional: 'admin@fup.edu.co',
      correoPersonal: 'admin@test.com',
      password: commonPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 1 Docente
  const teacher = await prisma.user.create({
    data: {
      name: 'Dr. Ramiro García',
      document: '2000',
      correoInstitucional: 'docente@fup.edu.co',
      correoPersonal: 'docente_p@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
    },
  });

  // 2 Estudiantes
  const student1 = await prisma.user.create({
    data: {
      name: 'Juan Pérez',
      document: '3001',
      correoInstitucional: 'estudiante1@fup.edu.co',
      correoPersonal: 'estudiante1_p@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'María López',
      document: '3002',
      correoInstitucional: 'estudiante2@fup.edu.co',
      correoPersonal: 'estudiante2_p@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });

  console.log('🏫 Creando sala...');
  const room = await prisma.room.create({
    data: {
      name: 'Laboratorio 301',
      type: RoomType.SALA_COMPUTO,
      capacity: 25,
      description: 'Sala de cómputo con 25 PCs de alto rendimiento',
    },
  });

  console.log('📚 Creando materia y grupo...');
  const subject = await prisma.subject.create({
    data: {
      name: 'Algoritmos y Estructura de Datos',
      code: 'AED-101',
      group: '10A',
      jornada: Jornada.DIURNO,
      credits: 4,
      periodoAcademico: '2025-1',
      teacherIds: [teacher.id],
      classroom: room.name,
      studentIds: [student1.id, student2.id],
    },
  });

  console.log('🔗 Creando asignaciones de grupo y matrículas...');
  // Asignación organizacional (Paso 6)
  await prisma.groupAssignment.createMany({
    data: [
      { studentId: student1.id, grupoNombre: '10A', periodoAcademico: '2025-1' },
      { studentId: student2.id, grupoNombre: '10A', periodoAcademico: '2025-1' },
    ],
  });

  // Matrícula formal (Paso 7)
  await prisma.enrollment.createMany({
    data: [
      { studentId: student1.id, subjectId: subject.id, periodoAcademico: '2025-1', status: EnrollmentStatus.ACTIVA },
      { studentId: student2.id, subjectId: subject.id, periodoAcademico: '2025-1', status: EnrollmentStatus.ACTIVA },
    ],
  });

  console.log('\n✅ Seed completado exitosamente!');
  console.log('---------------------------------');
  console.log('CREDENCIALES (Password: password123)');
  console.log(`Admin   : ${admin.correoInstitucional}`);
  console.log(`Docente : ${teacher.correoInstitucional}`);
  console.log(`Estud 1 : ${student1.correoInstitucional}`);
  console.log(`Estud 2 : ${student2.correoInstitucional}`);
  console.log('---------------------------------');
  console.log(`Materia : ${subject.name} [Grupo ${subject.group}]`);
  console.log(`Sala    : ${room.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
