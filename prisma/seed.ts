import {
  BookingStatus,
  ClassStatus,
  EnrollmentStatus,
  EventType,
  Jornada,
  PrismaClient,
  Role,
  RoomType,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => hash(password, 12);

/** Convierte periodo 5 dígitos (20221) a formato "2022-1" */
function periodoToStr(p: string): string {
  const year = p.slice(0, 4);
  const sem = p.slice(4, 5);
  return `${year}-${sem}`;
}

/** Datos de las 46 asignaturas: code, name, periodo (5 dígitos), credits */
const ASIGNATURAS: { code: string; name: string; periodo: string; credits: number }[] = [
  { code: '711001', name: 'Matemáticas Generales', periodo: '20221', credits: 4 },
  { code: '712001', name: 'Calculo Univariado', periodo: '20222', credits: 3 },
  { code: '713001', name: 'Calculo Multivariado', periodo: '20231', credits: 3 },
  { code: '714001', name: 'Ecuaciones Diferenciales', periodo: '20232', credits: 3 },
  { code: '715001', name: 'Investigación De Operaciones', periodo: '20221', credits: 3 },
  { code: '716001', name: 'Principios De Hardware', periodo: '20231', credits: 4 },
  { code: '717001', name: 'Internet De Las Cosas', periodo: '20232', credits: 3 },
  { code: '718001', name: 'Calidad De Software', periodo: '20242', credits: 3 },
  { code: '719001', name: 'Práctica Empresarial', periodo: '20252', credits: 9 },
  { code: '711002', name: 'Fundamentos De Sistemas De Inform', periodo: '20221', credits: 3 },
  { code: '712002', name: 'Algebra Lineal', periodo: '20222', credits: 3 },
  { code: '713002', name: 'Física I', periodo: '20231', credits: 4 },
  { code: '714002', name: 'Estadística', periodo: '20232', credits: 4 },
  { code: '715002', name: 'Bases De Datos', periodo: '20221', credits: 4 },
  { code: '716002', name: 'Administración De Bases De Datos', periodo: '20241', credits: 4 },
  { code: '717002', name: 'Proyecto De Investigación I', periodo: '20241', credits: 3 },
  { code: '718002', name: 'Administración De Redes', periodo: '20251', credits: 3 },
  { code: '719002', name: 'Trabajo De Grado', periodo: '20252', credits: 6 },
  { code: '711003', name: 'Algoritmos', periodo: '20221', credits: 4 },
  { code: '712003', name: 'Programación Orientada A Objetos', periodo: '20221', credits: 4 },
  { code: '713003', name: 'Programación Orientada A Objetos', periodo: '20221', credits: 4 },
  { code: '714003', name: 'Física Ii', periodo: '20232', credits: 4 },
  { code: '715003', name: 'Matemáticas Discretas', periodo: '20232', credits: 3 },
  { code: '716003', name: 'Ingeniería Del Software Iii', periodo: '20241', credits: 3 },
  { code: '717003', name: 'Redes', periodo: '20221', credits: 3 },
  { code: '718003', name: 'Proyecto De Investigación Ii', periodo: '20251', credits: 3 },
  { code: '711004', name: 'Comunicación Oral Y Escrita', periodo: '20221', credits: 2 },
  { code: '712004', name: 'Constitución Y Ética Profesional', periodo: '20221', credits: 2 },
  { code: '713004', name: 'Estructura De Datos', periodo: '20221', credits: 4 },
  { code: '714004', name: 'Ingeniería Del Software I', periodo: '20221', credits: 3 },
  { code: '715004', name: 'Sistemas Operativos', periodo: '20221', credits: 3 },
  { code: '716004', name: 'Algoritmos Computacionales', periodo: '20241', credits: 3 },
  { code: '717004', name: 'Aplicaciones Web', periodo: '20242', credits: 3 },
  { code: '718004', name: 'Electiva Profesional Iii', periodo: '20242', credits: 3 },
  { code: '711005', name: 'Electiva Socio Humanística I', periodo: '20221', credits: 2 },
  { code: '712005', name: 'Electiva Socio Humanística Ii', periodo: '20221', credits: 2 },
  { code: '713005', name: 'Enfoque Empresarial', periodo: '20222', credits: 2 },
  { code: '714005', name: 'Teoría De Sistemas', periodo: '20221', credits: 3 },
  { code: '715005', name: 'Ingeniería Del Software Ii', periodo: '20231', credits: 3 },
  { code: '716005', name: 'Electiva Profesional I', periodo: '20221', credits: 3 },
  { code: '717005', name: 'Inteligencia Artificial', periodo: '20242', credits: 3 },
  { code: '718005', name: 'Gestión De Proyectos Informáticos', periodo: '20251', credits: 3 },
  { code: '711006', name: 'Actividad Formativa', periodo: '20221', credits: 1 },
  { code: '714006', name: 'Emprendimiento E Innovación', periodo: '20231', credits: 2 },
  { code: '717006', name: 'Electiva Profesional Ii', periodo: '20222', credits: 3 },
  { code: '718006', name: 'Proyecto Social Tic', periodo: '20222', credits: 3 },
];

/** Genera al menos 16 temas descriptivos según el nombre de la asignatura */
function generarTemas(subjectName: string, count = 16): { title: string; order: number }[] {
  const base = subjectName.toLowerCase();
  const temas: { title: string; order: number }[] = [];
  const prefijos = [
    'Introducción a',
    'Fundamentos de',
    'Conceptos básicos de',
    'Historia y evolución de',
    'Metodologías en',
    'Aplicaciones de',
    'Modelos y teorías de',
    'Análisis de',
    'Diseño en',
    'Implementación de',
    'Evaluación y métricas de',
    'Casos de estudio en',
    'Herramientas para',
    'Buenas prácticas en',
    'Tendencias actuales en',
    'Proyecto integrador de',
    'Seminario avanzado en',
    'Taller práctico de',
  ];
  for (let i = 0; i < count; i++) {
    const pref = prefijos[i % prefijos.length];
    temas.push({ title: `${pref} ${base} - Unidad ${i + 1}`, order: i + 1 });
  }
  return temas;
}

async function main() {
  console.log('🗑️  Deep cleaning database...');

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

  await prisma.user.create({
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

  await prisma.user.create({
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

  const docente1 = await prisma.user.create({
    data: {
      name: 'Luis Alfonso Vejarano Sanchez',
      document: 'DOC001',
      correoInstitucional: 'luis.vejarano@docente.fup.edu.co',
      correoPersonal: 'luis.vejarano@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
      signatureUrl: 'https://placehold.co/400x200?text=Firma+Resguardo',
    },
  });

  const docente2 = await prisma.user.create({
    data: {
      name: 'Daniela Iboth Gutierrez Idrobo',
      document: 'DOC002',
      correoInstitucional: 'daniela.gutierrez@docente.fup.edu.co',
      correoPersonal: 'daniela.gutierrez@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
    },
  });

  const estudiante1 = await prisma.user.create({
    data: {
      name: 'Manuel Esteban Erazo Medina',
      document: '3001',
      correoInstitucional: 'manuel.erazo@estudiante.fup.edu.co',
      correoPersonal: 'manuel.erazo@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
      codigoEstudiantil: 'COD-ME-001',
    },
  });

  const estudiante2 = await prisma.user.create({
    data: {
      name: 'Andres Mauricio Peña Guasca',
      document: '3002',
      correoInstitucional: 'andres.pena@estudiante.fup.edu.co',
      correoPersonal: 'andres.pena@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
      codigoEstudiantil: 'COD-AP-002',
    },
  });
  console.log('🏫 Creating institutional spaces (SJ & SC)...');
  const roomData: { name: string; type: RoomType; capacity: number }[] = [
    { name: 'Sala 101 SJ', type: RoomType.SALA_COMPUTO, capacity: 25 },
    { name: 'Sala 102 SJ', type: RoomType.SALA_COMPUTO, capacity: 25 },
    { name: 'Salón 201 SJ', type: RoomType.SALON, capacity: 40 },
    { name: 'Salón 202 SJ', type: RoomType.SALON, capacity: 35 },
    { name: 'Auditorio Principal SJ', type: RoomType.AUDITORIO, capacity: 120 },
    { name: 'Sala 101 SC', type: RoomType.SALA_COMPUTO, capacity: 20 },
    { name: 'Sala 102 SC', type: RoomType.SALA_COMPUTO, capacity: 20 },
    { name: 'Salón 301 SC', type: RoomType.SALON, capacity: 30 },
    { name: 'Salón 302 SC', type: RoomType.SALON, capacity: 30 },
    { name: 'Auditorio San Camilo SC', type: RoomType.AUDITORIO, capacity: 80 },
  ];
  const rooms = await Promise.all(roomData.map(r => prisma.room.create({ data: r })));

  console.log('📚 Creating 46 subjects with 16+ topics each...');
  const createdSubjectIds: string[] = [];
  for (const a of ASIGNATURAS) {
    const subject = await prisma.subject.create({
      data: {
        name: a.name,
        code: a.code,
        group: null,
        credits: a.credits,
        directHours: 4,
        periodoAcademico: periodoToStr(a.periodo),
        teacherIds: [],
        studentIds: [],
      },
    });
    createdSubjectIds.push(subject.id);
    const temas = generarTemas(a.name, 16);
    await prisma.subjectContent.createMany({
      data: temas.map(t => ({
        subjectId: subject.id,
        type: 'TEMA',
        title: t.title,
        order: t.order,
      })),
    });
  }

  console.log('🔗 Assigning demo teachers and enrollments...');
  const subParaDemo = createdSubjectIds.slice(0, 6);
  const [sub1, sub2, sub3, sub4, sub5, sub6] = subParaDemo;
  await prisma.subject.update({
    where: { id: sub1 },
    data: {
      teacherIds: [docente1.id],
      classroom: rooms[0].name,
      jornada: Jornada.DIURNO,
    },
  });
  await prisma.subject.update({
    where: { id: sub2 },
    data: {
      teacherIds: [docente1.id],
      classroom: rooms[1].name,
      jornada: Jornada.DIURNO,
    },
  });
  await prisma.subject.update({
    where: { id: sub3 },
    data: {
      teacherIds: [docente2.id],
      classroom: rooms[2].name,
      jornada: Jornada.DIURNO,
    },
  });
  await prisma.subject.update({
    where: { id: sub4 },
    data: {
      teacherIds: [docente2.id],
      classroom: rooms[5].name,
      jornada: Jornada.NOCTURNO,
    },
  });
  await prisma.subject.update({
    where: { id: sub5 },
    data: {
      teacherIds: [docente1.id],
      classroom: rooms[0].name,
      jornada: Jornada.DIURNO,
    },
  });
  await prisma.subject.update({
    where: { id: sub6 },
    data: {
      teacherIds: [docente2.id],
      classroom: rooms[1].name,
      jornada: Jornada.DIURNO,
    },
  });

  const periodoDemo = '2022-1';
  await prisma.groupAssignment.createMany({
    data: [
      { studentId: estudiante1.id, grupoNombre: '6A', periodoAcademico: periodoDemo },
      { studentId: estudiante2.id, grupoNombre: '6A', periodoAcademico: periodoDemo },
    ],
  });
  await prisma.enrollment.createMany({
    data: [
      {
        studentId: estudiante1.id,
        subjectId: sub1,
        periodoAcademico: periodoDemo,
        status: EnrollmentStatus.ACTIVA,
      },
      {
        studentId: estudiante1.id,
        subjectId: sub2,
        periodoAcademico: periodoDemo,
        status: EnrollmentStatus.ACTIVA,
      },
      {
        studentId: estudiante2.id,
        subjectId: sub1,
        periodoAcademico: periodoDemo,
        status: EnrollmentStatus.ACTIVA,
      },
      {
        studentId: estudiante2.id,
        subjectId: sub3,
        periodoAcademico: periodoDemo,
        status: EnrollmentStatus.ACTIVA,
      },
    ],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const classDate = new Date(today);
  classDate.setDate(today.getDate() - 1);
  const startTime = new Date(classDate);
  startTime.setHours(8, 0, 0, 0);
  const endTime = new Date(classDate);
  endTime.setHours(10, 0, 0, 0);
  await prisma.class.create({
    data: {
      subjectId: sub1,
      date: classDate,
      startTime,
      endTime,
      status: ClassStatus.REALIZADA,
      topic: 'Introducción y repaso',
      classroom: rooms[0].name,
      totalStudents: 2,
    },
  });

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const bStart = new Date(tomorrow);
  bStart.setHours(14, 0, 0, 0);
  const bEnd = new Date(tomorrow);
  bEnd.setHours(16, 0, 0, 0);
  await prisma.roomBooking.create({
    data: {
      roomId: rooms[4].id,
      teacherId: docente2.id,
      startTime: bStart,
      endTime: bEnd,
      reason: 'Sesión de trabajo en equipo',
      status: BookingStatus.PENDIENTE,
    },
  });

  const examDate = new Date(today);
  examDate.setDate(today.getDate() + 5);
  await prisma.subjectEvent.create({
    data: {
      title: 'Parcial primer corte',
      date: examDate,
      type: EventType.EXAMEN,
      subjectId: sub1,
      createdById: docente1.id,
    },
  });

  console.log('\n🚀 FULL SEED COMPLETE!');
  console.log('-----------------------------------------');
  console.log('Admin:                admin@fup.edu.co');
  console.log('Coord:                coordinacion@fup.edu.co');
  console.log('Docente (Luis):       luis.vejarano@docente.fup.edu.co');
  console.log('Docente (Daniela):    daniela.gutierrez@docente.fup.edu.co');
  console.log('Estudiante (Manuel):  manuel.erazo@estudiante.fup.edu.co');
  console.log('Estudiante (Andres):  andres.pena@estudiante.fup.edu.co');
  console.log('-----------------------------------------');
  console.log(`Salas: ${rooms.length} (SJ y SC)`);
  console.log(`Asignaturas: ${ASIGNATURAS.length} con 16 temas cada una`);
  console.log('-----------------------------------------');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
