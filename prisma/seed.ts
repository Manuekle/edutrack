import { ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { addDays } from 'date-fns';

const prisma = new PrismaClient();

// Helper function to generate class dates (one per day, from 12:00 PM to 10:00 PM)
const generateClassDates = (startDate: Date, numberOfClasses: number): Date[] => {
  const dates: Date[] = [];

  // Usar la fecha actual como punto de partida
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Inicio del día actual
  let currentDate = new Date(today);
  currentDate.setHours(12, 0, 0, 0); // Establecer a las 12:00 PM hora local

  // Generate one class per day starting from today
  for (let i = 0; i < numberOfClasses; i++) {
    // Create class date at 12:00 PM local time
    const classDate = new Date(currentDate);
    classDate.setHours(12, 0, 0, 0);
    dates.push(classDate);

    // Move to next day
    currentDate = addDays(currentDate, 1);
  }

  return dates.slice(0, numberOfClasses);
};

// Helper function to create end time (10:00 PM on the same day)
const createEndTime = (startTime: Date): Date => {
  const endTime = new Date(startTime);
  // Set to 10:00 PM on the same day (10 hours after start)
  endTime.setHours(22, 0, 0, 0);
  return endTime;
};

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

async function main() {
  // Clean existing data in correct order to avoid foreign key constraints
  try {
    await prisma.attendance.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.subjectEvent.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.unenrollRequest.deleteMany({});
    await prisma.subject.deleteMany({});

    // Clear any existing users to avoid unique constraint errors
    await prisma.user.deleteMany({});
  } catch (error) {
    // Some tables might not exist yet, continuing...
  }

  // 1. Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      correoInstitucional: 'meerazo7@hotmail.com',
      correoPersonal: 'admin.personal@example.com',
      password: await hashPassword('admin123'),
      document: '10000000',
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // 2. Create teacher user
  const teacher = await prisma.user.create({
    data: {
      name: 'Docente Ejemplo',
      correoInstitucional: 'elustondo129@gmail.com',
      correoPersonal: 'docente.personal@example.com',
      password: await hashPassword('docente123'),
      document: '20000000',
      codigoDocente: 'DOC-001',
      role: Role.DOCENTE,
      isActive: true,
    },
  });

  // 3. Create students
  const student1 = await prisma.user.create({
    data: {
      name: 'Manuel Erazo',
      correoInstitucional: 'manuel.erazo@estudiante.fup.edu.co',
      correoPersonal: 'manuel.personal@example.com',
      password: await hashPassword('estudiante123'),
      document: '30000001',
      codigoEstudiantil: 'EST-001',
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: 'Andres Peña',
      correoInstitucional: 'andres.pena@estudiante.fup.edu.co',
      correoPersonal: 'andres.personal@example.com',
      password: await hashPassword('estudiante123'),
      document: '30000002',
      codigoEstudiantil: 'EST-002',
      role: Role.ESTUDIANTE,
      isActive: true,
    },
  });

  // 4. Create subjects
  const subjects = [
    {
      name: 'Programación Web',
      code: 'PW-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 5,
      credits: 3,
    },
    {
      name: 'Bases de Datos',
      code: 'BD-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 4,
      credits: 4,
    },
    {
      name: 'Inteligencia Artificial',
      code: 'IA-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 7,
      credits: 4,
    },
  ];

  const createdSubjects = [];
  const studentIds = [student1.id, student2.id];

  // 5. Create each subject and its classes
  for (const subjectData of subjects) {
    const subject = await prisma.subject.create({
      data: {
        name: subjectData.name,
        code: subjectData.code,
        program: subjectData.program,
        semester: subjectData.semester,
        credits: subjectData.credits,
        teacherId: teacher.id,
        studentIds, // Both students are enrolled in all subjects
      },
    });
    createdSubjects.push(subject);

    // Create 16 classes for this subject
    const classDates = generateClassDates(new Date(), 16);

    for (let i = 0; i < 16; i++) {
      const startTime = classDates[i];
      const endTime = createEndTime(startTime);

      // Create class with start and end times
      await prisma.class.create({
        data: {
          date: startTime,
          startTime: startTime,
          endTime: endTime,
          topic: `Clase ${i + 1}: ${subject.name}`,
          status: ClassStatus.PROGRAMADA,
          subjectId: subject.id,
        },
      });
    }
  }
}

// Execute the main function
main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
