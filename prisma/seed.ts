import { AttendanceStatus, ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays, subDays } from 'date-fns';

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
  { name: 'Programación Web', code: 'SIS-201', credits: 3, program: 'Sistemas', teacherIdx: 1 },
  { name: 'Estructura de Datos', code: 'SIS-202', credits: 4, program: 'Sistemas', teacherIdx: 1 },
  { name: 'Ética Profesional', code: 'HUM-301', credits: 2, program: 'Humanas', teacherIdx: 2 },
  { name: 'Historia del Arte', code: 'HUM-302', credits: 2, program: 'Humanas', teacherIdx: 2 },
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
  const password = await hashPassword('123456');

  // Admin
  await prisma.user.create({
    data: {
      name: 'Admin General',
      correoInstitucional: 'admin@edutrack.com',
      correoPersonal: 'admin@personal.com',
      password,
      role: Role.ADMIN,
      document: 'ADM-001',
    },
  });

  // Teachers
  const teachers = [];
  const teacherProfiles = [
    { name: 'Prof. Matemáticas', email: 'math@edutrack.com', personal: 'math@personal.com' },
    { name: 'Prof. Sistemas', email: 'dev@edutrack.com', personal: 'dev@personal.com' },
    { name: 'Prof. Humanidades', email: 'human@edutrack.com', personal: 'human@personal.com' },
  ];

  for (let i = 0; i < teacherProfiles.length; i++) {
    const t = await prisma.user.create({
      data: {
        name: teacherProfiles[i].name,
        correoInstitucional: teacherProfiles[i].email,
        correoPersonal: teacherProfiles[i].personal,
        password,
        role: Role.DOCENTE,
        document: `DOC-00${i + 1}`,
      },
    });
    teachers.push(t);
  }

  // Students
  const students = [];
  for (let i = 1; i <= 15; i++) {
    const s = await prisma.user.create({
      data: {
        name: `Estudiante ${i}`,
        correoInstitucional: `student${i}@edutrack.com`,
        correoPersonal: `student${i}@personal.com`,
        password,
        role: Role.ESTUDIANTE,
        document: `EST-0${i < 10 ? '0' + i : i}`,
        codigoEstudiantil: `2024-${i + 100}`,
      },
    });
    students.push(s);
  }
  console.log(`bustUsers created: 1 Admin, ${teachers.length} Teachers, ${students.length} Students`);

  // 3. Create Subjects & Enrollments
  const subjects = [];
  const today = new Date();
  
  // Date range: 2 months ago -> 2 months future
  const startDate = subDays(today, 60);
  const endDate = addDays(today, 60);

  for (const subData of SUBJECTS_DATA) {
    // Randomly select 8-12 students for this subject
    const shuffledStudents = [...students].sort(() => 0.5 - Math.random());
    const enrolledStudents = shuffledStudents.slice(0, getRandomInt(8, 12));
    const enrolledIds = enrolledStudents.map(s => s.id);

    const subject = await prisma.subject.create({
      data: {
        name: subData.name,
        code: subData.code,
        credits: subData.credits,
        program: subData.program,
        teacherId: teachers[subData.teacherIdx].id,
        studentIds: enrolledIds,
      },
    });
    subjects.push(subject);

    // 4. Generate Classes (Every 3 days)
    let currentDate = startDate;
    let classCount = 1;

    while (currentDate <= endDate) {
      // Skip Sundays
      if (currentDate.getDay() !== 0) {
        const isPast = currentDate < today;
        const classDate = new Date(currentDate);
        classDate.setHours(getRandomInt(7, 18), 0, 0, 0); // 7 AM to 6 PM
        const endTime = new Date(classDate);
        endTime.setHours(classDate.getHours() + 2);

        // Generate Class
        const newClass = await prisma.class.create({
          data: {
            subjectId: subject.id,
            date: classDate,
            startTime: classDate,
            endTime: endTime,
            topic: `Tema ${classCount}: Introducción a ${subject.name}`,
            status: isPast ? ClassStatus.REALIZADA : ClassStatus.PROGRAMADA,
            classroom: `Salón ${getRandomInt(100, 500)}`,
          },
        });

        // 5. Generate Attendance (if past class)
        if (isPast) {
            let present = 0, absent = 0, late = 0, justified = 0;

            for (const student of enrolledStudents) {
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
                        recordedAt: classDate, // Record as if it happened during class
                    }
                });

                if (status === AttendanceStatus.PRESENTE) present++;
                else if (status === AttendanceStatus.AUSENTE) absent++;
                else if (status === AttendanceStatus.TARDANZA) late++;
                else justified++;
            }

            // Update class metrics
            await prisma.class.update({
                where: { id: newClass.id },
                data: {
                    totalStudents: enrolledStudents.length,
                    presentCount: present,
                    absentCount: absent,
                    lateCount: late,
                    justifiedCount: justified
                }
            });
        }
        classCount++;
      }
      currentDate = addDays(currentDate, 3); // Every 3 days
    }
  }

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
