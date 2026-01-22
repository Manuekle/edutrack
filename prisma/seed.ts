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

  // 2. Create Users with specific test credentials
  const adminPassword = await hashPassword('admin123');
  const docentePassword = await hashPassword('docente123');
  const estudiantePassword = await hashPassword('estudiante123');

  // Admin
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

  // Teachers
  const teachers = [];
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
  teachers.push(teacher);

  // Students
  const students = [];
  const student1 = await prisma.user.create({
    data: {
      name: 'Manuel Erazo',
      correoInstitucional: 'manuel.erazo@estudiante.fup.edu.co',
      correoPersonal: 'manuel.erazo@estudiante.fup.edu.co',
      password: estudiantePassword,
      role: Role.ESTUDIANTE,
      document: 'EST-001',
      codigoEstudiantil: '2024-101',
    },
  });
  students.push(student1);

  const student2 = await prisma.user.create({
    data: {
      name: 'Andrés Peña',
      correoInstitucional: 'andres.pena@estudiante.fup.edu.co',
      correoPersonal: 'andres.pena@estudiante.fup.edu.co',
      password: estudiantePassword,
      role: Role.ESTUDIANTE,
      document: 'EST-002',
      codigoEstudiantil: '2024-102',
    },
  });
  students.push(student2);

  console.log(`✅ Users created: 1 Admin, ${teachers.length} Teacher, ${students.length} Students`);

  // 3. Create Subjects & Enrollments
  const subjects = [];
  const today = new Date();
  
  // Date range: 2 months ago -> 2 months future
  const startDate = subDays(today, 60);
  const endDate = addDays(today, 60);

  for (const subData of SUBJECTS_DATA) {
    // Enroll both students in all subjects
    const enrolledIds = students.map(s => s.id);

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
                    totalStudents: students.length,
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
