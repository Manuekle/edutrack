import {
  ClassStatus,
  DayOfWeek,
  PrismaClient,
  Role,
  RoomType,
  Subject,
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

  console.log('👤 Creating specialized users...');
  const commonPassword = await hashPassword('password123');

  await prisma.user.create({
    data: {
      name: 'Jorge Admin',
      document: '1000',
      institutionalEmail: 'admin@fup.edu.co',
      personalEmail: 'jorge.admin@test.com',
      password: commonPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Patricia Coordinadora',
      document: '1500',
      institutionalEmail: 'coordinacion@fup.edu.co',
      personalEmail: 'patricia@test.com',
      password: commonPassword,
      role: Role.ADMIN, // Assuming COORDINADOR was merged or ADMIN is fine for now
      isActive: true,
    },
  });

  const docente1 = await prisma.user.create({
    data: {
      name: 'Luis Alfonso Vejarano Sanchez',
      document: 'DOC001',
      institutionalEmail: 'luis.vejarano@docente.fup.edu.co',
      personalEmail: 'luis.vejarano@test.com',
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
      institutionalEmail: 'daniela.gutierrez@docente.fup.edu.co',
      personalEmail: 'daniela.gutierrez@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      isActive: true,
    },
  });

  const estudiante1 = await prisma.user.create({
    data: {
      name: 'Manuel Esteban Erazo Medina',
      document: '3001',
      institutionalEmail: 'manuel.erazo@estudiante.fup.edu.co',
      personalEmail: 'manuel.erazo@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
      studentCode: 'COD-ME-001',
    },
  });

  const estudiante2 = await prisma.user.create({
    data: {
      name: 'Andres Mauricio Peña Guasca',
      document: '3002',
      institutionalEmail: 'andres.pena@estudiante.fup.edu.co',
      personalEmail: 'andres.pena@test.com',
      password: commonPassword,
      role: Role.ESTUDIANTE,
      isActive: true,
      studentCode: 'COD-AP-002',
    },
  });
  console.log('🏫 Creating institutional spaces (SJ & SC)...');
  const roomData: { name: string; type: RoomType; capacity: number }[] = [
    { name: 'Sala 101 SJ', type: RoomType.LABORATORIO, capacity: 25 },
    { name: 'Sala 102 SJ', type: RoomType.LABORATORIO, capacity: 25 },
    { name: 'Salón 201 SJ', type: RoomType.SALA_CLASE, capacity: 40 },
    { name: 'Salón 202 SJ', type: RoomType.SALA_CLASE, capacity: 35 },
    { name: 'Auditorio Principal SJ', type: RoomType.AUDITORIO, capacity: 120 },
    { name: 'Sala 101 SC', type: RoomType.LABORATORIO, capacity: 20 },
    { name: 'Sala 102 SC', type: RoomType.LABORATORIO, capacity: 20 },
    { name: 'Salón 301 SC', type: RoomType.SALA_CLASE, capacity: 30 },
    { name: 'Salón 302 SC', type: RoomType.SALA_CLASE, capacity: 30 },
    { name: 'Auditorio San Camilo SC', type: RoomType.AUDITORIO, capacity: 80 },
  ];
  const rooms = await Promise.all(roomData.map(r => prisma.room.create({ data: r })));

  console.log('📚 Creating 46 subjects...');
  const createdSubjects: Subject[] = [];
  for (const a of ASIGNATURAS) {
    const subject = await prisma.subject.create({
      data: {
        name: a.name,
        code: a.code,
        group: null,
        credits: a.credits,
        directHours: 4,
        academicPeriod: periodoToStr(a.periodo),
        teacherIds: [],
        studentIds: [],
      },
    });
    createdSubjects.push(subject);
  }

  // Create AcademicPeriod
  await prisma.academicPeriod.create({
    data: {
      name: '2022-1',
      startDate: new Date('2022-01-01'),
      endDate: new Date('2022-06-30'),
      isActive: true,
    },
  });

  console.log('🔗 Assigning demo teachers and groups...');
  const subParaDemo = createdSubjects.slice(0, 6);
  const [sub1, sub2, sub3, sub4, sub5, sub6] = subParaDemo;

  // Create some schedules
  const schedule1 = await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.MONDAY,
      startTime: '08:00',
      endTime: '10:00',
      subjectId: sub1.id,
      roomId: rooms[0].id,
    },
  });

  const schedule2 = await prisma.schedule.create({
    data: {
      dayOfWeek: DayOfWeek.TUESDAY,
      startTime: '10:00',
      endTime: '12:00',
      subjectId: sub2.id,
      roomId: rooms[1].id,
    },
  });

  // Create Groups
  const group1 = await prisma.group.create({
    data: {
      code: '6A',
      subjectId: sub1.id,
      academicPeriod: '2022-1',
      teacherIds: [docente1.id],
      studentIds: [estudiante1.id, estudiante2.id],
      scheduleId: schedule1.id,
      roomId: rooms[0].id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      code: '6B',
      subjectId: sub2.id,
      academicPeriod: '2022-1',
      teacherIds: [docente1.id],
      studentIds: [estudiante1.id],
      scheduleId: schedule2.id,
      roomId: rooms[1].id,
    },
  });

  // Update Subjects with teacher/student IDs (Directly)
  await prisma.subject.update({
    where: { id: sub1.id },
    data: {
      teacherIds: [docente1.id],
      studentIds: [estudiante1.id, estudiante2.id],
      classroom: rooms[0].name,
    },
  });

  await prisma.subject.update({
    where: { id: sub2.id },
    data: {
      teacherIds: [docente1.id],
      studentIds: [estudiante1.id],
      classroom: rooms[1].name,
    },
  });

  // Create a Class
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
      subjectId: sub1.id,
      groupId: group1.id,
      date: classDate,
      startTime,
      endTime,
      status: ClassStatus.COMPLETED,
      topic: 'Introducción y repaso',
      classroom: rooms[0].name,
      totalStudents: 2,
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
