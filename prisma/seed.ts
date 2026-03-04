import { PrismaClient, Role, ClassStatus, AttendanceStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const hashPassword = async (password: string) => hash(password, 12);

const SUBJECTS = [
  { code: '711001', name: 'Matemáticas Generales', credits: 4, semester: 1 },
  { code: '712001', name: 'Calculo Univariado', credits: 3, semester: 2 },
  { code: '713001', name: 'Calculo Multivariado', credits: 3, semester: 3 },
  { code: '714001', name: 'Ecuaciones Diferenciales', credits: 3, semester: 4 },
  { code: '715001', name: 'Investigación De Operaciones', credits: 3, semester: 5 },
  { code: '716001', name: 'Principios De Hardware', credits: 4, semester: 6 },
  { code: '717001', name: 'Internet De Las Cosas', credits: 3, semester: 7 },
  { code: '718001', name: 'Calidad De Software', credits: 3, semester: 8 },
  { code: '711002', name: 'Fundamentos De Sistemas De Información', credits: 3, semester: 1 },
  { code: '712002', name: 'Algebra Lineal', credits: 3, semester: 2 },
  { code: '713002', name: 'Física I', credits: 4, semester: 3 },
  { code: '714002', name: 'Estadística', credits: 4, semester: 4 },
  { code: '715002', name: 'Bases De Datos', credits: 4, semester: 5 },
  { code: '716002', name: 'Administración De Bases De Datos', credits: 4, semester: 6 },
  { code: '711003', name: 'Algoritmos', credits: 4, semester: 1 },
  { code: '712003', name: 'Programación Orientada A Objetos', credits: 4, semester: 2 },
];

const DOCENTES = [
  { name: 'Dr. Carlos Alberto Mendoza García', documento: '75012345678' },
  { name: 'Dra. María Elena Rodríguez López', documento: '75012345679' },
  { name: 'Ing. Juan Pablo Castro Martínez', documento: '75012345680' },
  { name: 'Ing. Ana Patricia Quiroz Sánchez', documento: '75012345681' },
  { name: 'Dr. Luis Fernando Herrera Torres', documento: '75012345682' },
  { name: 'Ing. Diana Carolina Ramírez Cruz', documento: '75012345683' },
  { name: 'Mg. José Guillermo López Díaz', documento: '75012345684' },
  { name: 'Dra. Sandra Milena Vargas Ruiz', documento: '75012345685' },
  { name: 'Ing. Ricardo Andrés Moreno González', documento: '75012345686' },
  { name: 'Mg. Claudia Marcela Ibarra Vega', documento: '75012345687' },
];

const FIRST_NAMES = [
  'Juan',
  'María',
  'Carlos',
  'Ana',
  'Luis',
  'Sofía',
  'Pedro',
  'Lucía',
  'Jorge',
  'Elena',
  'Andrés',
  'Valentina',
  'Miguel',
  'Isabella',
  'Diego',
  'Camila',
  'Gabriel',
  'Natalia',
  'Fernando',
  'Daniela',
];

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Martínez',
  'Hernández',
  'López',
  'González',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Reyes',
  'Cruz',
  'Morales',
  'Ortiz',
  'Gutiérrez',
  'Chávez',
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStudentName(): string {
  return `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
}

async function main() {
  console.log('🚀 Starting SUPER SEED...');
  console.log('📅 Período: 6 febrero - 10 junio 2026');
  console.log('🎓 Ingeniería de Sistemas - FUP');

  console.log('\n🧹 Limpiando base de datos...');
  try {
    await prisma.attendance.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.subjectEvent.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.unenrollRequest.deleteMany({});
    await prisma.roomBooking.deleteMany({});
    await prisma.room.deleteMany({});
    await prisma.subject.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Base de datos limpiada');
  } catch (e) {
    console.log('ℹ️  Primera ejecución');
  }

  const commonPassword = await hashPassword('123456');

  console.log('\n👤 Creando usuarios core...');

  await prisma.user.create({
    data: {
      name: 'Administrador del Sistema',
      document: 'ADM-001',
      correoInstitucional: 'admin@fup.edu.co',
      correoPersonal: 'admin@fup.edu.co',
      password: commonPassword,
      role: Role.ADMIN,
      telefono: '3012345678',
    },
  });
  console.log('✅ Admin: admin@fup.edu.co');

  await prisma.user.create({
    data: {
      name: 'Coordinador Ingeniería de Sistemas',
      document: 'COR-001',
      correoInstitucional: 'coordinador@fup.edu.co',
      correoPersonal: 'coordinador@fup.edu.co',
      password: commonPassword,
      role: Role.COORDINADOR,
      telefono: '3012345679',
    },
  });
  console.log('✅ Coordinador: coordinador@fup.edu.co');

  console.log('\n👨‍🏫 Creando 10 docentes...');
  const teachers = [];
  for (let i = 0; i < DOCENTES.length; i++) {
    const doc = DOCENTES[i];
    const teacher = await prisma.user.create({
      data: {
        name: doc.name,
        document: doc.documento,
        correoInstitucional: `docente${i + 1}@fup.edu.co`,
        correoPersonal: `docente${i + 1}@gmail.com`,
        password: commonPassword,
        role: Role.DOCENTE,
        codigoDocente: `D-${String(i + 1).padStart(3, '0')}`,
        telefono: `300${String(1000000 + i).padStart(7, '0')}`,
      },
    });
    teachers.push(teacher);
    console.log(`  ✅ ${doc.name}`);
  }

  console.log('\n📚 Creando materias y estudiantes...');

  const subjectsCreated: any[] = [];
  let studentCount = 0;

  for (let t = 0; t < teachers.length; t++) {
    const teacher = teachers[t];

    for (let s = 0; s < 8; s++) {
      const subjectTemplate = SUBJECTS[(t * 8 + s) % SUBJECTS.length];

      const students = [];
      for (let i = 0; i < 10; i++) {
        studentCount++;
        const student = await prisma.user.create({
          data: {
            name: generateStudentName(),
            document: `1${String(100000000 + studentCount).padStart(9, '0')}`,
            correoInstitucional: `estudiante${studentCount}@fup.edu.co`,
            correoPersonal: `estudiante${studentCount}@gmail.com`,
            password: commonPassword,
            role: Role.ESTUDIANTE,
            codigoEstudiantil: `2024${String(1000 + studentCount).padStart(4, '0')}`,
          },
        });
        students.push(student.id);
      }

      const subject = await prisma.subject.create({
        data: {
          code: `${subjectTemplate.code}-${t + 1}${s < 4 ? 'A' : 'B'}`,
          name: subjectTemplate.name,
          group: s < 4 ? 'A' : 'B',
          program: 'Ingeniería de Sistemas',
          semester: subjectTemplate.semester,
          credits: subjectTemplate.credits,
          teacherIds: [teacher.id],
          studentIds: students,
          classroom: `Bloque ${String.fromCharCode(65 + (s % 3))} - Salon ${101 + (s % 8)}`,
        },
      });

      await prisma.user.updateMany({
        where: { id: { in: students } },
        data: { enrolledSubjectIds: { set: [subject.id] } },
      });

      subjectsCreated.push({ subject, studentIds: students });
    }

    if ((t + 1) % 2 === 0) {
      console.log(`  📊 ${(t + 1) * 8}/80 materias...`);
    }
  }

  console.log('\n📅 Creando clases históricas (solo 1 clase por materia)...');

  let totalClasses = 0;
  let totalAttendances = 0;

  for (const { subject, studentIds } of subjectsCreated) {
    const classDate = new Date('2026-02-09');
    const startTime = new Date(classDate);
    startTime.setHours(7, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 2);

    const cls = await prisma.class.create({
      data: {
        subjectId: subject.id,
        date: classDate,
        startTime: startTime,
        endTime: endTime,
        topic: `Tema 1: ${subject.name}`,
        status: ClassStatus.REALIZADA,
        classroom: subject.classroom,
        totalStudents: studentIds.length,
      },
    });

    const attendancePromises = studentIds.map(async (studentId: string) => {
      const rand = Math.random();
      let status: AttendanceStatus;
      let justification: string | null = null;

      if (rand < 0.8) {
        status = AttendanceStatus.PRESENTE;
      } else if (rand < 0.88) {
        status = AttendanceStatus.TARDANZA;
      } else if (rand < 0.95) {
        status = AttendanceStatus.AUSENTE;
      } else {
        status = AttendanceStatus.JUSTIFICADO;
        justification = 'Ausencia justificada';
      }

      await prisma.attendance.create({
        data: {
          studentId: studentId,
          classId: cls.id,
          status: status,
          justification: justification,
          recordedAt: startTime,
        },
      });

      totalAttendances++;
    });

    await Promise.all(attendancePromises);

    const present = await prisma.attendance.count({
      where: { classId: cls.id, status: AttendanceStatus.PRESENTE },
    });
    const absent = await prisma.attendance.count({
      where: { classId: cls.id, status: AttendanceStatus.AUSENTE },
    });
    const late = await prisma.attendance.count({
      where: { classId: cls.id, status: AttendanceStatus.TARDANZA },
    });
    const justified = await prisma.attendance.count({
      where: { classId: cls.id, status: AttendanceStatus.JUSTIFICADO },
    });

    await prisma.class.update({
      where: { id: cls.id },
      data: {
        presentCount: present,
        absentCount: absent,
        lateCount: late,
        justifiedCount: justified,
      },
    });

    totalClasses++;

    if (totalClasses % 20 === 0) {
      console.log(`  📊 ${totalClasses}/80 clases...`);
    }
  }

  console.log('\n🏢 Creando salas...');
  const rooms = [
    { name: 'Bloque A - Salon 101', type: 'SALON' as const, capacity: 35 },
    { name: 'Bloque A - Salon 102', type: 'SALON' as const, capacity: 35 },
    { name: 'Bloque B - Salon 201', type: 'SALON' as const, capacity: 40 },
    { name: 'Bloque B - Salon 202', type: 'SALON' as const, capacity: 40 },
    { name: 'Bloque C - Salon 301', type: 'SALON' as const, capacity: 35 },
    { name: 'Laboratorio de Sistemas 1', type: 'SALA_COMPUTO' as const, capacity: 25 },
    { name: 'Auditorio Principal', type: 'AUDITORIO' as const, capacity: 150 },
  ];

  for (const room of rooms) {
    await prisma.room.create({
      data: { ...room, description: `Sala FUP - ${room.name}`, isActive: true },
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SUPER SEED COMPLETADO');
  console.log('='.repeat(60));
  console.log(`   👤 Admin: 1`);
  console.log(`   👥 Coordinador: 1`);
  console.log(`   👨‍🏫 Docentes: ${teachers.length}`);
  console.log(`   👨‍🎓 Estudiantes: ${studentCount}`);
  console.log(`   📚 Materias: ${subjectsCreated.length}`);
  console.log(`   📅 Clases: ${totalClasses}`);
  console.log(`   ✅ Asistencias: ${totalAttendances}`);
  console.log(`   🏢 Salas: ${rooms.length}`);
  console.log('\n📅 Período: 6 febrero - 10 junio 2026');
  console.log('\n🔑 Credenciales (password: 123456):');
  console.log('   admin@fup.edu.co');
  console.log('   coordinador@fup.edu.co');
  console.log('   docente1@fup.edu.co ... docente10@fup.edu.co');
  console.log('   estudiante1@fup.edu.co ... estudiante' + studentCount + '@fup.edu.co');
  console.log('='.repeat(60));
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
