import { BookingStatus, ClassStatus, EnrollmentStatus, EventType, Jornada, PrismaClient, Role, RoomType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => hash(password, 12);

async function main() {
  console.log('🗑️  Deep cleaning database...');
  
  // order matters for cascade and relations
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
  await prisma.user.deleteMany();

  console.log('👤 Creating specialized users...');
  const commonPassword = await hashPassword('password123');

  // Admins
  const admin = await prisma.user.create({
    data: {
      name: 'Jorge Admin',
      document: '1000',
      correoInstitucional: 'admin@fup.edu.co',
      correoPersonal: 'jorge.admin@test.com',
      password: commonPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Coordinators
  const admin2 = await prisma.user.create({
    data: {
      name: 'Patricia Coordinadora',
      document: '1500',
      correoInstitucional: 'coordinacion@fup.edu.co',
      correoPersonal: 'patricia@test.com',
      password: commonPassword,
      role: Role.COORDINADOR,
      isActive: true,
    },
  });

  // Teachers
  const t1 = await prisma.user.create({
    data: {
      name: 'Dr. Ramiro García',
      document: '2000',
      correoInstitucional: 'r.garcia@fup.edu.co',
      correoPersonal: 'ramiro@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
      signatureUrl: 'https://placehold.co/400x200?text=Firma+Resguardo',
    },
  });

  const t2 = await prisma.user.create({
    data: {
      name: 'Ing. Sandra Restrepo',
      document: '2001',
      correoInstitucional: 's.restrepo@fup.edu.co',
      correoPersonal: 'sandra@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
    },
  });

  // Students - Batch 1 (Group 10A)
  const studentsA = [];
  for (let i = 1; i <= 5; i++) {
    const s = await prisma.user.create({
      data: {
        name: `Estudiante A${i}`,
        document: `300${i}`,
        correoInstitucional: `student.a${i}@fup.edu.co`,
        correoPersonal: `personal.a${i}@test.com`,
        password: commonPassword,
        role: Role.ESTUDIANTE,
        isActive: true,
        codigoEstudiantil: `COD-10A-${i}`,
      },
    });
    studentsA.push(s);
  }

  // Students - Batch 2 (Group 10B)
  const studentsB = [];
  for (let i = 1; i <= 3; i++) {
    const s = await prisma.user.create({
      data: {
        name: `Estudiante B${i}`,
        document: `400${i}`,
        correoInstitucional: `student.b${i}@fup.edu.co`,
        correoPersonal: `personal.b${i}@test.com`,
        password: commonPassword,
        role: Role.ESTUDIANTE,
        isActive: true,
        codigoEstudiantil: `COD-10B-${i}`,
      },
    });
    studentsB.push(s);
  }

  console.log('🏫 Creating institutional spaces...');
  const rooms = await Promise.all([
    prisma.room.create({ data: { name: 'Laboratorio 301', type: RoomType.SALA_COMPUTO, capacity: 30 } }),
    prisma.room.create({ data: { name: 'Laboratorio 302', type: RoomType.SALA_COMPUTO, capacity: 20 } }),
    prisma.room.create({ data: { name: 'Salón 101', type: RoomType.SALON, capacity: 40 } }),
    prisma.room.create({ data: { name: 'Auditorio Central', type: RoomType.AUDITORIO, capacity: 150 } }),
  ]);

  console.log('📚 Creating curriculum structure...');
  const sub1 = await prisma.subject.create({
    data: {
      name: 'Programación de Sistemas',
      code: 'SYS-101',
      group: '10A',
      periodoAcademico: '2025-1',
      credits: 4,
      jornada: Jornada.DIURNO,
      teacherIds: [t1.id],
      classroom: rooms[0].name,
      studentIds: studentsA.map(s => s.id),
      description: 'Fundamentos de bajo nivel y arquitectura de software.',
    },
  });

  const sub2 = await prisma.subject.create({
    data: {
      name: 'Inteligencia Artificial',
      code: 'AI-202',
      group: '10B',
      periodoAcademico: '2025-1',
      credits: 3,
      jornada: Jornada.NOCTURNO,
      teacherIds: [t2.id],
      classroom: rooms[1].name,
      studentIds: studentsB.map(s => s.id),
    },
  });

  console.log('🔗 Connecting Administrative Flow (Steps 6 & 7)...');
  // Step 6: Assignments
  await prisma.groupAssignment.createMany({
    data: [
      ...studentsA.map(s => ({ studentId: s.id, grupoNombre: '10A', periodoAcademico: '2025-1' })),
      ...studentsB.map(s => ({ studentId: s.id, grupoNombre: '10B', periodoAcademico: '2025-1' })),
    ]
  });

  // Step 7: Formal Enrollments
  await prisma.enrollment.createMany({
    data: [
      ...studentsA.map(s => ({ studentId: s.id, subjectId: sub1.id, periodoAcademico: '2025-1', status: EnrollmentStatus.ACTIVA })),
      ...studentsB.map(s => ({ studentId: s.id, subjectId: sub2.id, periodoAcademico: '2025-1', status: EnrollmentStatus.ACTIVA })),
    ]
  });

  console.log('🗓️ Generating classes and attendance...');
  const today = new Date();
  today.setHours(0,0,0,0);

  // Generate 5 past classes for tracking
  for (let i = 5; i > 0; i--) {
    const classDate = new Date(today);
    classDate.setDate(today.getDate() - i);
    
    // Start at 8 AM
    const startTime = new Date(classDate);
    startTime.setHours(8, 0, 0, 0);
    
    // End at 10 AM
    const endTime = new Date(classDate);
    endTime.setHours(10, 0, 0, 0);
    
    const cls = await prisma.class.create({
      data: {
        subjectId: sub1.id,
        date: classDate,
        startTime: startTime,
        endTime: endTime,
        status: ClassStatus.REALIZADA,
        topic: `Semana ${6-i}: Principios de Ingeniería`,
        classroom: rooms[0].name,
        totalStudents: studentsA.length,
      }
    });

    // Random attendance
    await prisma.attendance.createMany({
      data: studentsA.map(s => ({
        studentId: s.id,
        classId: cls.id,
        status: Math.random() > 0.2 ? 'PRESENTE' : 'AUSENTE',
      }))
    });
  }

  // Next week classes
  for (let i = 1; i < 4; i++) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + i);
    
    const startTime = new Date(nextDate);
    startTime.setHours(8, 0, 0, 0);
    
    const endTime = new Date(nextDate);
    endTime.setHours(10, 0, 0, 0);

    await prisma.class.create({
      data: {
        subjectId: sub1.id,
        date: nextDate,
        startTime: startTime,
        endTime: endTime,
        status: ClassStatus.PROGRAMADA,
        classroom: rooms[0].name,
        totalStudents: studentsA.length,
      }
    });
  }

  console.log('📝 Creating Administrative Requests & Bookings...');
  // Room Booking
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const bStartTime = new Date(tomorrow);
  bStartTime.setHours(14, 0, 0, 0);
  const bEndTime = new Date(tomorrow);
  bEndTime.setHours(16, 0, 0, 0);

  await prisma.roomBooking.create({
    data: {
      roomId: rooms[3].id, // Auditorio
      teacherId: t2.id,
      startTime: bStartTime,
      endTime: bEndTime,
      reason: 'Conferencia sobre Ética en IA',
      status: BookingStatus.PENDIENTE,
    }
  });

  // Unenroll Request
  await prisma.unenrollRequest.create({
    data: {
      studentId: studentsB[0].id,
      subjectId: sub2.id,
      reason: 'Cruce de horario con trabajo nuevo',
      status: 'PENDIENTE',
      requestedById: studentsB[0].id,
    }
  });

  // Subject Events
  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 2);
  await prisma.subjectEvent.create({
    data: {
      title: 'Parcial primer corte',
      date: examDate,
      type: EventType.EXAMEN,
      subjectId: sub1.id,
      createdById: t1.id,
    }
  });

  console.log('\n🚀 FULL SEED COMPLETE!');
  console.log('-----------------------------------------');
  console.log('Admin (Jorge)         : admin@fup.edu.co');
  console.log('Coord (Patricia)      : coordinacion@fup.edu.co');
  console.log('Docente (Ramiro)      : r.garcia@fup.edu.co');
  console.log('Docente (Sandra)      : s.restrepo@fup.edu.co');
  console.log('Estudiantes (A1-A5)   : student.aX@fup.edu.co');
  console.log('Estudiantes (B1-B3)   : student.bX@fup.edu.co');
  console.log('-----------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
