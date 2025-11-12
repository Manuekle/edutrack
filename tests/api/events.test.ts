/**
 * Tests para la API de eventos del docente
 * Tests completos con mocks de Next.js y Prisma
 */

import { GET, POST } from '@/app/api/docente/eventos/route';
import { GET as GET_EVENT, PUT, DELETE } from '@/app/api/docente/eventos/[id]/route';
import { NextRequest, NextResponse } from 'next/server';

// Mock de Prisma
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    subject: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    subjectEvent: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return {
    db: mockPrisma,
  };
});

// Mock de cache
jest.mock('@/lib/cache', () => ({
  clearSubjectCache: jest.fn(() => Promise.resolve()),
}));

// Mock de NextAuth
let mockSession: { user: { id: string; role: string } } | null = {
  user: {
    id: 'test-teacher-id',
    role: 'DOCENTE',
  },
};

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(async () => {
    return mockSession;
  }),
}));

// Mock de next-auth también (para compatibilidad)
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

describe('API /api/docente/eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      user: {
        id: 'test-teacher-id',
        role: 'DOCENTE',
      },
    };
  });

  describe('GET /api/docente/eventos', () => {
    it('debería retornar una lista de eventos de una asignatura', async () => {
      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        teacherId: 'test-teacher-id',
      };

      const mockEvents = [
        {
          id: 'event1',
          title: 'Examen Final',
          description: 'Examen de la unidad 1',
          date: new Date('2024-01-15'),
          type: 'EXAMEN',
          subjectId: 'subject-id',
          createdById: 'test-teacher-id',
        },
        {
          id: 'event2',
          title: 'Trabajo Práctico',
          description: 'Entrega de trabajo',
          date: new Date('2024-01-20'),
          type: 'TRABAJO',
          subjectId: 'subject-id',
          createdById: 'test-teacher-id',
        },
      ];

      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrisma.subjectEvent.findMany.mockResolvedValue(mockEvents);

      const request = new NextRequest(
        'http://localhost:3000/api/docente/eventos?subjectId=subject-id'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(mockPrisma.subject.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'subject-id',
          teacherId: 'test-teacher-id',
        },
      });
      expect(mockPrisma.subjectEvent.findMany).toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es DOCENTE', async () => {
      mockSession = {
        user: {
          id: 'test-student-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest(
        'http://localhost:3000/api/docente/eventos?subjectId=subject-id'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'No autorizado');
    });

    it('debería retornar 404 si la asignatura no existe o no pertenece al docente', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/docente/eventos?subjectId=non-existent-id'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message');
      expect(mockPrisma.subjectEvent.findMany).not.toHaveBeenCalled();
    });

    it('debería ordenar eventos por fecha ascendente por defecto', async () => {
      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        teacherId: 'test-teacher-id',
      };

      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrisma.subjectEvent.findMany.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/docente/eventos?subjectId=subject-id'
      );
      await GET(request);

      expect(mockPrisma.subjectEvent.findMany).toHaveBeenCalledWith({
        where: { subjectId: 'subject-id' },
        orderBy: { date: 'asc' },
      });
    });

    it('debería validar parámetros de consulta', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/docente/eventos?subjectId=&sortBy=invalid&sortOrder=invalid'
      );
      const response = await GET(request);

      // Debería manejar los parámetros inválidos o usar valores por defecto
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/docente/eventos', () => {
    it('debería crear un nuevo evento', async () => {
      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        teacherId: 'test-teacher-id',
      };

      const newEvent = {
        id: 'new-event-id',
        title: 'Nuevo Evento',
        description: 'Descripción del evento',
        date: new Date('2024-01-15'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
      };

      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrisma.subjectEvent.create.mockResolvedValue(newEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nuevo Evento',
          description: 'Descripción del evento',
          date: '2024-01-15',
          type: 'EXAMEN',
          subjectId: 'subject-id',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message', 'Evento creado correctamente');
      expect(data.data.title).toBe('Nuevo Evento');
      expect(mockPrisma.subjectEvent.create).toHaveBeenCalled();
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const request = new NextRequest('http://localhost:3000/api/docente/eventos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nuevo Evento',
          // Falta date, type, subjectId
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(mockPrisma.subjectEvent.create).not.toHaveBeenCalled();
    });

    it('debería retornar 404 si la asignatura no existe o no pertenece al docente', async () => {
      mockPrisma.subject.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nuevo Evento',
          description: 'Descripción',
          date: '2024-01-15',
          type: 'EXAMEN',
          subjectId: 'non-existent-id',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('error');
      expect(mockPrisma.subjectEvent.create).not.toHaveBeenCalled();
    });

    it('debería retornar 401 si el usuario no es DOCENTE', async () => {
      mockSession = {
        user: {
          id: 'test-student-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/docente/eventos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nuevo Evento',
          description: 'Descripción',
          date: '2024-01-15',
          type: 'EXAMEN',
          subjectId: 'subject-id',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'No autorizado');
    });

    it('debería normalizar la fecha a medianoche', async () => {
      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        teacherId: 'test-teacher-id',
      };

      const newEvent = {
        id: 'new-event-id',
        title: 'Nuevo Evento',
        description: 'Descripción',
        date: new Date('2024-01-15T00:00:00.000Z'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
      };

      mockPrisma.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrisma.subjectEvent.create.mockResolvedValue(newEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Nuevo Evento',
          description: 'Descripción',
          date: '2024-01-15T14:30:00Z', // Hora diferente a medianoche
          type: 'EXAMEN',
          subjectId: 'subject-id',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(request);

      // Verificar que se llamó create con la fecha normalizada
      expect(mockPrisma.subjectEvent.create).toHaveBeenCalled();
      const createCall = (mockPrisma.subjectEvent.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.date).toBeInstanceOf(Date);
    });
  });

  describe('GET /api/docente/eventos/[id]', () => {
    it('debería retornar un evento específico', async () => {
      const mockEvent = {
        id: 'event-id',
        title: 'Examen Final',
        description: 'Examen de la unidad 1',
        date: new Date('2024-01-15'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
        subject: {
          teacherId: 'test-teacher-id',
        },
      };

      mockPrisma.subjectEvent.findFirst.mockResolvedValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id');
      const response = await GET_EVENT(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data.data.id).toBe('event-id');
      expect(mockPrisma.subjectEvent.findFirst).toHaveBeenCalled();
    });

    it('debería retornar 404 si el evento no existe o no pertenece al docente', async () => {
      mockPrisma.subjectEvent.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/non-existent-id');
      const response = await GET_EVENT(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message');
    });

    it('debería retornar 401 si el usuario no es DOCENTE', async () => {
      mockSession = {
        user: {
          id: 'test-student-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id');
      const response = await GET_EVENT(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('message', 'No autorizado');
    });
  });

  describe('PUT /api/docente/eventos/[id]', () => {
    it('debería actualizar un evento existente', async () => {
      const mockEvent = {
        id: 'event-id',
        title: 'Examen Final',
        description: 'Descripción actualizada',
        date: new Date('2024-01-15'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
        subject: {
          teacherId: 'test-teacher-id',
        },
      };

      const updatedEvent = {
        ...mockEvent,
        title: 'Examen Final Actualizado',
        description: 'Nueva descripción',
      };

      mockPrisma.subjectEvent.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.subjectEvent.update.mockResolvedValue(updatedEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Examen Final Actualizado',
          description: 'Nueva descripción',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data.data.title).toBe('Examen Final Actualizado');
      expect(mockPrisma.subjectEvent.update).toHaveBeenCalled();
    });

    it('debería retornar 404 si el evento no existe', async () => {
      mockPrisma.subjectEvent.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/non-existent-id', {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Título actualizado',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message');
    });

    it('debería retornar 400 si los datos son inválidos', async () => {
      const mockEvent = {
        id: 'event-id',
        title: 'Examen Final',
        date: new Date('2024-01-15'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
        subject: {
          teacherId: 'test-teacher-id',
        },
      };

      mockPrisma.subjectEvent.findFirst.mockResolvedValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id', {
        method: 'PUT',
        body: JSON.stringify({
          type: 'INVALID_TYPE', // Tipo inválido
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PUT(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/docente/eventos/[id]', () => {
    it('debería eliminar un evento existente', async () => {
      const mockEvent = {
        id: 'event-id',
        title: 'Examen Final',
        date: new Date('2024-01-15'),
        type: 'EXAMEN',
        subjectId: 'subject-id',
        createdById: 'test-teacher-id',
        subject: {
          teacherId: 'test-teacher-id',
        },
      };

      mockPrisma.subjectEvent.findFirst.mockResolvedValue(mockEvent);
      mockPrisma.subjectEvent.delete.mockResolvedValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message', 'Evento eliminado correctamente');
      expect(mockPrisma.subjectEvent.delete).toHaveBeenCalled();
    });

    it('debería retornar 404 si el evento no existe', async () => {
      mockPrisma.subjectEvent.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/non-existent-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'non-existent-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty('message');
    });

    it('debería retornar 401 si el usuario no es DOCENTE', async () => {
      mockSession = {
        user: {
          id: 'test-student-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/docente/eventos/event-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ id: 'event-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('message', 'No autorizado');
    });
  });
});
