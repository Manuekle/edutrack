import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// --- Helpers ---
const hashPassword = async (password: string) => hash(password, 12);

const PROGRAMS = ['Ingeniería de Sistemas', 'Derecho', 'Psicología', 'Administración de Empresas'];
const NAMES_FIRST = ['Juan', 'Maria', 'Carlos', 'Ana', 'Luis', 'Sofia', 'Pedro', 'Lucia', 'Jorge', 'Elena', 'Andres', 'Valentina'];
const NAMES_LAST = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres'];

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateName = () => `${getRandomElement(NAMES_FIRST)} ${getRandomElement(NAMES_LAST)}`;

const SUBJECT_TEMPLATES = [
  // Sistemas
  { name: 'Cálculo Diferencial', code: 'MAT-101', credits: 4, program: 'Ingeniería de Sistemas', semester: 1 },
  { name: 'Programación Básica', code: 'SIS-101', credits: 3, program: 'Ingeniería de Sistemas', semester: 1 },
  { name: 'Álgebra Lineal', code: 'MAT-102', credits: 3, program: 'Ingeniería de Sistemas', semester: 2 },
  { name: 'Estructura de Datos', code: 'SIS-201', credits: 4, program: 'Ingeniería de Sistemas', semester: 3 },
  { name: 'Bases de Datos', code: 'SIS-301', credits: 3, program: 'Ingeniería de Sistemas', semester: 4 },
  // Derecho
  { name: 'Introducción al Derecho', code: 'DER-101', credits: 3, program: 'Derecho', semester: 1 },
  { name: 'Derecho Romano', code: 'DER-102', credits: 3, program: 'Derecho', semester: 1 },
  { name: 'Derecho Constitucional', code: 'DER-201', credits: 4, program: 'Derecho', semester: 2 },
  // Psicologia
  { name: 'Fundamentos de Psicología', code: 'PSI-101', credits: 3, program: 'Psicología', semester: 1 },
  { name: 'Psicología Evolutiva', code: 'PSI-201', credits: 3, program: 'Psicología', semester: 2 },
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
    console.log('first run');
  }

  const commonPassword = await hashPassword('123456');

  // 2. Create Core Users (Admin & Main Teacher)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin General',
      correoInstitucional: 'meerazo7@hotmail.com',
      correoPersonal: 'meerazo7@hotmail.com',
      password: commonPassword,
      role: Role.ADMIN,
      document: 'ADM-001',
    },
  });

  const mainTeacher = await prisma.user.create({
    data: {
      name: 'Prof. Esteban Lustondo',
      correoInstitucional: 'elustondo129@gmail.com',
      correoPersonal: 'elustondo@test.com',
      password: commonPassword,
      role: Role.DOCENTE,
      document: 'DOC-MAIN',
      codigoDocente: 'D-001',
    },
  });

  // 3. Create Extra Teachers
  const teachers = [mainTeacher];
  for (let i = 1; i <= 5; i++) {
    const t = await prisma.user.create({
      data: {
        name: `Prof. ${generateName()}`,
        correoInstitucional: `docente${i}@fup.edu.co`,
        correoPersonal: `docente${i}@gmail.com`,
        password: commonPassword,
        role: Role.DOCENTE,
        document: `DOC-00${i+1}`,
        codigoDocente: `D-00${i+1}`,
      },
    });
    teachers.push(t);
  }
  console.log(`✅ Created ${teachers.length} teachers`);

  // 4. Create Students (50)
  const students = [];
  for (let i = 1; i <= 50; i++) {
    const s = await prisma.user.create({
      data: {
        name: generateName(),
        correoInstitucional: `estudiante${i}@fup.edu.co`,
        correoPersonal: `estudiante${i}@gmail.com`,
        password: commonPassword,
        role: Role.ESTUDIANTE,
        document: `EST-${1000 + i}`,
        codigoEstudiantil: `2024-${1000 + i}`,
      },
    });
    students.push(s);
  }
  console.log(`✅ Created ${students.length} students`);

  // 5. Create Subjects & Groups
  for (const template of SUBJECT_TEMPLATES) {
    // Decidir si crear 1 o 2 grupos
    const groups = Math.random() > 0.6 ? ['A', 'B'] : ['A'];

    for (const group of groups) {
      // Assign random teacher
      const teacher = getRandomElement(teachers);
      
      // Assign random students (10-20)
      const subjectStudents = students
        .sort(() => 0.5 - Math.random())
        .slice(0, getRandomInt(10, 20));
      
      const studentIds = subjectStudents.map(s => s.id);

      const subject = await prisma.subject.create({
        data: {
            name: template.name,
            code: template.code,
            program: template.program,
            semester: template.semester,
            credits: template.credits,
            group: group,
            teachers: {
              connect: [{ id: teacher.id }]
            },
            studentIds: studentIds, // Subject -> Student (Scalar list, assuming manual sync or handled)
            classroom: `Salon ${getRandomInt(100, 300)}`,
        }
      });

      // Update Students -> Subject (Two-way sync)
      // Note: In a real app this might be handled by middleware or transaction, but in seed we do it manually
      for (const student of subjectStudents) {
         await prisma.user.update({
             where: { id: student.id },
             data: {
                 enrolledSubjectIds: { push: subject.id }
             }
         });
      }

      // 6. Create Classes for this Subject (Past & Future)
      // Generate 10 classes
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 15); // Start 15 days ago

      for (let c = 0; c < 10; c++) {
         const classDate = new Date(startDate);
         classDate.setDate(startDate.getDate() + (c * 2)); // Every 2 days roughly
         
         const start = new Date(classDate);
         start.setHours(8 + getRandomInt(0, 4), 0, 0); // Random morning time
         
         const end = new Date(start);
         end.setHours(start.getHours() + 2); // 2 hours duration

         await prisma.class.create({
            data: {
                subjectId: subject.id,
                date: classDate,
                startTime: start,
                endTime: end,
                topic: `Clase ${c + 1}: Tema ${c + 1}`,
                description: 'Descripción de la clase de prueba',
                classroom: subject.classroom 
            }
         });
      }
    }
  }

  console.log('✅ Subjects, Groups, Enrollments & Classes created');
  console.log('🌱 Seed finished');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
