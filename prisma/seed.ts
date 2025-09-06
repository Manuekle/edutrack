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

  console.log(`Current local time: ${new Date().toLocaleString()}`);
  console.log(`Starting classes from: ${currentDate.toLocaleString()}`);

  // Generate one class per day starting from today
  for (let i = 0; i < numberOfClasses; i++) {
    // Create class date at 12:00 PM local time
    const classDate = new Date(currentDate);
    classDate.setHours(12, 0, 0, 0);
    dates.push(classDate);

    console.log(`Class ${i + 1} scheduled for: ${classDate.toLocaleString()}`);

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
  console.log('🚀 Starting seeding...');

  // Clean existing data in correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');

  try {
    await prisma.attendance.deleteMany({});
    await prisma.class.deleteMany({});
    await prisma.subjectEvent.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.unenrollRequest.deleteMany({});
    await prisma.subject.deleteMany({});

    // Clear any existing users to avoid unique constraint errors
    await prisma.user.deleteMany({});

    console.log('✅ Successfully cleaned all existing data');
  } catch (error) {
    console.log('⚠️ Some tables might not exist yet, continuing...');
  }

  console.log('👥 Creating users...');

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
  console.log(`✅ Created admin user: ${admin.correoInstitucional}`);

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
  console.log(`✅ Created teacher user: ${teacher.correoInstitucional}`);

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
  console.log(`✅ Created student: ${student1.name}`);

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
  console.log(`✅ Created student: ${student2.name}`);

  // 4. Create subjects
  console.log('📚 Creating subjects...');
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
    console.log(`✅ Created subject: ${subject.name}`);

    // Create 16 classes for this subject
    console.log(`   Creating classes for ${subject.name}...`);
    const classDates = generateClassDates(new Date(), 16);

    for (let i = 0; i < 16; i++) {
      const startTime = classDates[i];
      const endTime = createEndTime(startTime);

      console.log(`   📅 Creating class ${i + 1}:`);
      console.log(`      Start: ${startTime.toLocaleString()}`);
      console.log(`      End: ${endTime.toLocaleString()}`);

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
    console.log(`   ✅ Created 16 classes for ${subject.name} (12:00 PM - 10:00 PM)`);
  }

  console.log('\n🎉 Seeding completed successfully!');
  console.log('================================');
  console.log('Summary:');
  console.log(`👤 Admin: 1 user`);
  console.log(`👨‍🏫 Teachers: 1 user`);
  console.log(`👨‍🎓 Students: 2 users`);
  console.log(`📚 Subjects: 3 subjects`);
  console.log(`📅 Classes: 48 classes total (16 per subject)`);
  console.log(`⏰ Schedule: Daily, 12:00 PM - 10:00 PM (10 hours)`);
  console.log('================================');
  console.log('Credentials:');
  console.log('Admin:');
  console.log('  Email: meerazo7@hotmail.com');
  console.log('  Password: admin123');
  console.log('');
  console.log('Teacher:');
  console.log('  Email: elustondo129@gmail.com');
  console.log('  Password: docente123');
  console.log('');
  console.log('Students:');
  console.log('  Email: manuel.erazo@estudiante.fup.edu.co');
  console.log('  Email: andres.pena@estudiante.fup.edu.co');
  console.log('  Password: estudiante123');
  console.log('================================');
}

// Execute the main function
main()
  .catch(e => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
