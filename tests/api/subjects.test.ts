/**
 * Tests para la API de asignaturas
 * Tests completos con mocks de Next.js y Prisma
 */

import { GET, POST } from '@/app/api/admin/subjects/route';
import { PATCH, DELETE } from '@/app/api/admin/subjects/[id]/route';
import { NextRequest } from 'next/server';

// Mock de Prisma - debe ser definido antes de los mocks
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    subject: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };
  return {
    db: mockPrisma,
  };
});

// Mock de NextAuth
let mockSession: { user: { id: string; role: string } } | null = {
  user: {
    id: 'test-admin-id',
    role: 'ADMIN',
  },
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(async () => {
    return mockSession;
  }),
}));

// Mock de authOptions
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Importar después de los mocks
const { db } = require('@/lib/prisma');
const mockPrisma = db;

describe('API /api/admin/subjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto, el usuario es ADMIN
    mockSession = {
      user: {
        id: 'test-admin-id',
        role: 'ADMIN',
      },
    };
  });

  describe('GET /api/admin/subjects', () => {
    it('debería retornar una lista de asignaturas con paginación', async () => {
      const mockSubjects = [
        {
          id: '1',
          name: 'Test Subject',
          code: 'TEST001',
          teacherId: 'teacher1',
          studentIds: [],
          teacher: {
            id: 'teacher1',
            name: 'Test Teacher',
          },
          _count: {
            classes: 5,
          },
        },
      ];

      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrisma.subject.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.pagination).toHaveProperty('page', 1);
      expect(data.pagination).toHaveProperty('limit', 10);
      expect(data.pagination).toHaveProperty('total', 1);
      expect(mockPrisma.subject.findMany).toHaveBeenCalled();
      expect(mockPrisma.subject.count).toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/subjects');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error', 'Acceso denegado');
      expect(mockPrisma.subject.findMany).not.toHaveBeenCalled();
    });

    it('debería filtrar asignaturas por búsqueda', async () => {
      mockPrisma.subject.findMany.mockResolvedValue([]);
      mockPrisma.subject.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/subjects?search=test&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.subject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('debería incluir información del docente en la respuesta', async () => {
      const mockSubjects = [
        {
          id: '1',
          name: 'Test Subject',
          code: 'TEST001',
          teacherId: 'teacher1',
          studentIds: [],
          teacher: {
            id: 'teacher1',
            name: 'Test Teacher',
          },
          _count: {
            classes: 5,
          },
        },
      ];

      mockPrisma.subject.findMany.mockResolvedValue(mockSubjects);
      mockPrisma.subject.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0]).toHaveProperty('teacher');
      expect(data.data[0].teacher).toHaveProperty('name', 'Test Teacher');
    });
  });

  describe('POST /api/admin/subjects', () => {
    it('debería crear una nueva asignatura', async () => {
      const newSubject = {
        id: 'new-subject-id',
        name: 'New Subject',
        code: 'NEW001',
        teacherId: 'teacher1',
        studentIds: [],
        program: null,
        semester: null,
        credits: null,
        createdAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'teacher1',
        role: 'DOCENTE',
      });
      mockPrisma.subject.findFirst.mockResolvedValue(null); // No existe asignatura con ese código
      mockPrisma.subject.create.mockResolvedValue(newSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Subject',
          code: 'NEW001',
          teacherId: 'teacher1',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('name', 'New Subject');
      expect(data).toHaveProperty('code', 'NEW001');
      expect(data).toHaveProperty('studentCount', 0);
      expect(data).toHaveProperty('classCount', 0);
      expect(mockPrisma.subject.create).toHaveBeenCalled();
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Subject',
          // Falta code y teacherId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      expect(mockPrisma.subject.create).not.toHaveBeenCalled();
    });

    it('debería retornar 409 si el código ya existe', async () => {
      const existingSubject = {
        id: 'existing-subject-id',
        code: 'EXIST001',
      };

      mockPrisma.subject.findUnique.mockResolvedValue(existingSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Subject',
          code: 'EXIST001',
          teacherId: 'teacher1',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('código');
      expect(mockPrisma.subject.create).not.toHaveBeenCalled();
    });

    it('debería retornar 404 si el docente no existe', async () => {
      // Primero verificar que el código no existe
      mockPrisma.subject.findUnique.mockResolvedValue(null);
      // Luego verificar que el docente no existe
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Subject',
          code: 'NEW002', // Usar un código diferente para evitar conflictos
          teacherId: 'non-existent-teacher',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toContain('docente');
      expect(mockPrisma.subject.create).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Subject',
          code: 'NEW001',
          teacherId: 'teacher1',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.subject.create).not.toHaveBeenCalled();
    });
  });

  describe('PATCH /api/admin/subjects/[id]', () => {
    it('debería actualizar una asignatura existente', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
        program: null,
        semester: null,
        credits: null,
      };

      const updatedSubject = {
        ...existingSubject,
        name: 'Updated Subject',
        program: 'Ingeniería',
        semester: 5,
        credits: 3,
        teacher: {
          id: 'teacher1',
          name: 'Test Teacher',
          correoInstitucional: 'teacher@example.com',
          codigoDocente: 'T001',
        },
        _count: {
          classes: 5,
        },
      };

      mockPrisma.subject.findUnique.mockResolvedValueOnce(existingSubject); // Para verificar existencia
      mockPrisma.subject.findUnique.mockResolvedValueOnce(null); // Para verificar que el código no existe
      mockPrisma.subject.update.mockResolvedValue(updatedSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Subject',
          program: 'Ingeniería',
          semester: '5',
          credits: '3',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Subject');
      expect(data.program).toBe('Ingeniería');
      expect(data.studentCount).toBe(0);
      expect(data.classCount).toBe(5);
      expect(mockPrisma.subject.update).toHaveBeenCalled();
    });

    it('debería retornar 404 si la asignatura no existe', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/non-existent-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Subject',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toContain('no encontrada');
      expect(mockPrisma.subject.update).not.toHaveBeenCalled();
    });

    it('debería retornar 409 si el código ya está en uso', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
      };

      const subjectWithCode = {
        id: 'other-subject-id',
        code: 'NEWCODE001',
      };

      mockPrisma.subject.findUnique.mockResolvedValueOnce(existingSubject); // Para verificar existencia
      mockPrisma.subject.findUnique.mockResolvedValueOnce(subjectWithCode); // El código ya existe

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'PATCH',
        body: JSON.stringify({
          code: 'NEWCODE001',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('código');
      expect(mockPrisma.subject.update).not.toHaveBeenCalled();
    });

    it('debería retornar 404 si el docente no existe', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
      };

      mockPrisma.subject.findUnique.mockResolvedValueOnce(existingSubject);
      mockPrisma.user.findUnique.mockResolvedValue(null); // El docente no existe

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: 'non-existent-teacher',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toContain('docente');
      expect(mockPrisma.subject.update).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si el usuario seleccionado no es docente', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
      };

      const nonTeacher = {
        id: 'student-id',
        role: 'ESTUDIANTE',
      };

      mockPrisma.subject.findUnique.mockResolvedValueOnce(existingSubject);
      mockPrisma.user.findUnique.mockResolvedValue(nonTeacher);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'PATCH',
        body: JSON.stringify({
          teacherId: 'student-id',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('docente');
      expect(mockPrisma.subject.update).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Subject',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.subject.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/subjects/[id]', () => {
    it('debería eliminar una asignatura existente sin estudiantes ni clases', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
        _count: {
          classes: 0,
        },
      };

      mockPrisma.subject.findUnique.mockResolvedValue(existingSubject);
      mockPrisma.subject.delete.mockResolvedValue(existingSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Asignatura eliminada correctamente.');
      expect(mockPrisma.subject.delete).toHaveBeenCalledWith({
        where: { id: 'subject-id' },
      });
    });

    it('debería retornar 404 si la asignatura no existe', async () => {
      mockPrisma.subject.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/non-existent-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toContain('no encontrada');
      expect(mockPrisma.subject.delete).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si la asignatura tiene estudiantes matriculados', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: ['student1', 'student2'],
        _count: {
          classes: 0,
        },
      };

      mockPrisma.subject.findUnique.mockResolvedValue(existingSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('estudiantes');
      expect(mockPrisma.subject.delete).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si la asignatura tiene clases programadas', async () => {
      const existingSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        code: 'TEST001',
        teacherId: 'teacher1',
        studentIds: [],
        _count: {
          classes: 5,
        },
      };

      mockPrisma.subject.findUnique.mockResolvedValue(existingSubject);

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('clases');
      expect(mockPrisma.subject.delete).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/subjects/subject-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'subject-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.subject.delete).not.toHaveBeenCalled();
    });
  });
});
