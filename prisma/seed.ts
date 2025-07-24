import { ClassStatus, PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper function to generate dates for classes (skipping weekends)
const generateClassDates = (startDate: Date, count: number): Date[] => {
  const dates: Date[] = [];
  const dateCounter = new Date(startDate);

  while (dates.length < count) {
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dateCounter.getDay() !== 0 && dateCounter.getDay() !== 6) {
      const date = new Date(dateCounter);
      dates.push(date);
    }
    dateCounter.setDate(dateCounter.getDate() + 1);
  }

  return dates;
};

// Hash password helper
const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

async function main() {
  console.log('🚀 Starting seeding...');

  // Clean existing data in the correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.attendance.deleteMany({});
  await prisma.class.deleteMany({});
  await prisma.subjectEvent.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.unenrollRequest.deleteMany({});
  await prisma.subject.deleteMany({});

  // First, update all users to have null codigoEstudiantil to avoid unique constraint
  console.log('🔄 Updating existing users...');
  await prisma.user.updateMany({
    where: { role: 'ESTUDIANTE' },
    data: { codigoEstudiantil: null },
  });

  // Then delete all users
  await prisma.user.deleteMany({});

  console.log('👥 Creating users...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Sistema',
      correoInstitucional: 'admin@admin.fup.edu.co',
      correoPersonal: `admin.personal${Date.now()}@gmail.com`,
      password: await hashPassword('admin123'),
      document: '1000000000',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${admin.correoInstitucional}`);

  // Create teacher user with unique code
  const teacherCode = `T${Date.now().toString().slice(-4)}`;
  const teacher = await prisma.user.create({
    data: {
      name: 'Docente Ejemplo',
      correoInstitucional: 'docente@docente.fup.edu.co',
      correoPersonal: `docente.personal${Date.now() + 1}@gmail.com`,
      password: await hashPassword('docente123'),
      document: '2000000000',
      codigoDocente: teacherCode,
      role: Role.DOCENTE,
      isActive: true,
      signatureUrl: 'https://example.com/signature.png',
    },
  });
  console.log(`✅ Created teacher user: ${teacher.correoInstitucional} with code ${teacherCode}`);

  // Create 8 student users with unique codes
  const students = [];
  const usedStudentCodes = new Set();

  for (let i = 1; i <= 8; i++) {
    // Generate a unique student code
    let studentNumber = i.toString().padStart(4, '0');
    let studentCode = `S${studentNumber}`;

    // Ensure code is unique
    while (usedStudentCodes.has(studentCode)) {
      studentNumber = (parseInt(studentNumber) + 1).toString().padStart(4, '0');
      studentCode = `S${studentNumber}`;
    }
    usedStudentCodes.add(studentCode);
    try {
      // Create a unique timestamp for this student
      const timestamp = Date.now() + i;

      const student = await prisma.user.create({
        data: {
          name: `Estudiante${i} Apellido${i}`,
          correoInstitucional: `estudiante${i}@estudiante.fup.edu.co`,
          correoPersonal: `estudiante${i}.personal${timestamp}@gmail.com`,
          password: await hashPassword('estudiante123'),
          document: `300000000${i}`,
          codigoEstudiantil: studentCode, // Use the unique student code we generated
          codigoDocente: null, // Explicitly set to null for students
          role: Role.ESTUDIANTE,
          isActive: true,
          telefono: `+57 3${Math.floor(1000000 + Math.random() * 9000000)}`,
        },
      });
      students.push(student);
      console.log(
        `✅ Created student ${i}: ${student.correoInstitucional} with code ${studentCode}`
      );
    } catch (error) {
      console.error(`❌ Error creating student ${i}:`, error);
      throw error; // Re-throw to stop execution on error
    }
  }
  console.log(`✅ Created ${students.length} student users`);

  console.log('📚 Creating subject...');
  // Create one subject
  const subject = await prisma.subject.create({
    data: {
      name: 'Programación Web',
      code: 'PW-2025-1',
      program: 'Ingeniería de Sistemas',
      semester: 5,
      credits: 3,
      teacher: {
        connect: { id: teacher.id },
      },
      studentIds: students.map(student => student.id),
    },
  });
  console.log(`✅ Created subject: ${subject.name}`);

  // Update students with enrolled subject
  await Promise.all(
    students.map(student =>
      prisma.user.update({
        where: { id: student.id },
        data: {
          enrolledSubjectIds: {
            push: subject.id,
          },
        },
      })
    )
  );

  console.log('📅 Creating classes...');
  // Create 5 classes starting from today, skipping weekends
  const classDates = generateClassDates(new Date(), 5);

  const classes = [];
  for (let i = 0; i < 5; i++) {
    const classDate = new Date(classDates[i]);
    const startTime = new Date(classDate);
    startTime.setHours(0, 0, 0, 0); // 00:00:00
    const endTime = new Date(classDate);
    endTime.setHours(23, 59, 59, 999); // 23:59:59.999

    const classItem = await prisma.class.create({
      data: {
        date: startTime,
        startTime,
        endTime,
        topic: `Tema ${i + 1}: Introducción al tema ${i + 1}`,
        description: `Esta es la clase ${i + 1} de Programación Web`,
        status: ClassStatus.PROGRAMADA,
        subject: {
          connect: { id: subject.id },
        },
        classroom: `A${Math.floor(Math.random() * 5) + 1}0${Math.floor(Math.random() * 5) + 1}`,
        qrToken:
          Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        qrTokenExpiresAt: new Date(endTime.getTime()), // Expira al final del día
        totalStudents: students.length,
      },
    });
    classes.push(classItem);
  }
  console.log(`✅ Created ${classes.length} classes`);

  console.log('🎉 Seeding completed!');
  console.log('================================');
  console.log('Summary:');
  console.log('👤 Admin: 1');
  console.log('👨‍🏫 Teacher: 1');
  console.log(`👨‍🎓 Students: ${students.length}`);
  console.log('📚 Subject: 1');
  console.log(`📅 Classes: ${classes.length}`);
  console.log('================================');
  console.log('Admin credentials:');
  console.log(`Email: admin@admin.fup.edu.co`);
  console.log(`Password: admin123`);
  console.log('--------------------------------');
  console.log('Teacher credentials:');
  console.log(`Email: docente@docente.fup.edu.co`);
  console.log(`Password: docente123`);
  console.log('--------------------------------');
  console.log('Student credentials (use any from 1-8):');
  console.log(`Email: estudiante1@estudiante.fup.edu.co`);
  console.log(`Password: estudiante123`);
  console.log('================================');
}

// Execute the main function
main()
  .then(() => {
    console.log('🚀 Seeding completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  });
