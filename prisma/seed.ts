import { AttendanceStatus, ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays, isSameDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

// --- Helpers ---

const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// --- Data ---
const SUBJECTS_DATA = [
  { name: 'Cálculo Diferencial', code: 'MAT-101', credits: 4, program: 'Ingeniería', teacherIdx: 0 },
  { name: 'Álgebra Lineal', code: 'MAT-102', credits: 3, program: 'Ingeniería', teacherIdx: 0 },
  { name: 'Programación Web', code: 'SIS-201', credits: 3, program: 'Sistemas', teacherIdx: 0 },
  { name: 'Estructura de Datos', code: 'SIS-202', credits: 4, program: 'Sistemas', teacherIdx: 0 },
];

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Clean Database
  try {
    await prisma.attendance.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.subjectEvent.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.unenrollRequest.deleteMany({});
    await prisma.subject.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('🧹 Database cleaned');
  } catch (e) {
    console.log('First run (tables empty)');
  }

  // 2. Create Users
  const adminPassword = await hashPassword('admin123');
  const docentePassword = await hashPassword('docente123');
  const estudiantePassword = await hashPassword('estudiante123');

  await prisma.user.create({
    data: {
      name: 'Admin General',
      correoInstitucional: 'meerazo7@hotmail.com',
      correoPersonal: 'meerazo7@hotmail.com',
      password: adminPassword,
      role: Role.ADMIN,
      document: 'ADM-001',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      name: 'Prof. Esteban Lustondo',
      correoInstitucional: 'elustondo129@gmail.com',
      correoPersonal: 'elustondo129@gmail.com',
      password: docentePassword,
      role: Role.DOCENTE,
      document: 'DOC-001',
    },
  });

  const students = [];
  for (let i = 1; i <= 2; i++) {
    const student = await prisma.user.create({
      data: {
        name: i === 1 ? 'Manuel Erazo' : 'Andrés Peña',
        correoInstitucional: i === 1 ? 'manuel.erazo@estudiante.fup.edu.co' : 'andres.pena@estudiante.fup.edu.co',
        correoPersonal: i === 1 ? 'manuel.erazo@estudiante.fup.edu.co' : 'andres.pena@estudiante.fup.edu.co',
        password: estudiantePassword,
        role: Role.ESTUDIANTE,
        document: `EST-00${i}`,
        codigoEstudiantil: `2024-10${i}`,
      },
    });
    students.push(student);
  }

  console.log('✅ Users created');

  // 3. Create a single Subject
  const today = new Date();
  const subData = SUBJECTS_DATA[2]; // 'Programación Web'
  const enrolledIds = students.map(s => s.id);

  const subject = await prisma.subject.create({
    data: {
      name: subData.name,
      code: subData.code,
      credits: subData.credits,
      program: subData.program,
      teacherId: teacher.id,
      studentIds: enrolledIds,
    },
  });

  // 4. Generate 16 consecutive Classes
  let currentDate = subDays(today, 8); // 8 days ago

  for (let i = 1; i <= 16; i++) {
    const isToday = isSameDay(currentDate, today);
    const isPast = currentDate < today && !isToday;
    
    const classDate = new Date(currentDate);
    const startTime = new Date(currentDate);
    const endTime = new Date(currentDate);

    if (isToday) {
      // Force active class NOW (Current time 18:31)
      startTime.setHours(18, 0, 0, 0);
      endTime.setHours(20, 0, 0, 0);
    } else {
      // Random hours between 7 AM and 5 PM
      const startHour = getRandomInt(7, 17);
      startTime.setHours(startHour, 0, 0, 0);
      endTime.setHours(startHour + 2, 0, 0, 0);
    }

    const newClass = await prisma.class.create({
      data: {
        subjectId: subject.id,
        date: classDate,
        startTime: startTime,
        endTime: endTime,
        topic: `Sesión ${i}: Avance curricular - ${subject.name}`,
        status: isPast ? ClassStatus.REALIZADA : ClassStatus.PROGRAMADA,
        classroom: `Laboratorio ${getRandomInt(100, 500)}`,
      },
    });

    // 5. Generate Attendance for past classes
    if (isPast) {
      let present = 0, absent = 0, late = 0, justified = 0;

      for (const student of students) {
        const rand = Math.random();
        let status: AttendanceStatus = AttendanceStatus.PRESENTE;

        if (rand > 0.95) status = AttendanceStatus.JUSTIFICADO;
        else if (rand > 0.85) status = AttendanceStatus.AUSENTE;
        else if (rand > 0.75) status = AttendanceStatus.TARDANZA;

        await prisma.attendance.create({
          data: {
            classId: newClass.id,
            studentId: student.id,
            status: status,
            recordedAt: startTime,
          }
        });

        if (status === AttendanceStatus.PRESENTE) present++;
        else if (status === AttendanceStatus.AUSENTE) absent++;
        else if (status === AttendanceStatus.TARDANZA) late++;
        else justified++;
      }

      await prisma.class.update({
        where: { id: newClass.id },
        data: {
          totalStudents: students.length,
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          justifiedCount: justified
        }
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  console.log(`✅ Subject '${subject.name}' with 16 classes created.`);
  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
