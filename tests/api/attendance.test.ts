/**
 * Tests para la API de asistencia
 * Tests completos con mocks de Next.js y Prisma
 */

import { POST } from '@/app/api/asistencia/scan/route';
import { NextRequest } from 'next/server';

// Mock de Prisma - debe ser definido antes de los mocks
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    class: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    attendance: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    subject: {
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
    id: 'test-student-id',
    role: 'ESTUDIANTE',
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

// Mock de rateLimit - crear el mock dentro de jest.mock para evitar problemas de hoisting
jest.mock('@/lib/rateLimit', () => {
  // Crear el mock dentro de la factory function
  const mockCheckFn = jest.fn(() => ({
    isRateLimited: false,
    limit: 5,
    remaining: 4,
  }));

  return {
    limiter: {
      check: mockCheckFn,
    },
  };
});

// Mock de cache
jest.mock('@/lib/cache', () => ({
  clearSubjectCache: jest.fn(() => Promise.resolve()),
}));

// Importar después de los mocks
import { db } from '@/lib/prisma';
import { limiter } from '@/lib/rateLimit';
const mockPrisma = db;

describe('API /api/asistencia/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Por defecto, el usuario está autenticado como estudiante
    mockSession = {
      user: {
        id: 'test-student-id',
        role: 'ESTUDIANTE',
      },
    };
    // Reset rate limit mock - usar limiter directamente del mock
    (limiter.check as jest.Mock).mockReturnValue({
      isRateLimited: false,
      limit: 5,
      remaining: 4,
    });
  });

  describe('POST /api/asistencia/scan', () => {
    it('debería registrar asistencia correctamente', async () => {
      const mockClass = {
        id: 'class-id',
        subjectId: 'subject-id',
        date: new Date(),
        startTime: new Date(Date.now() - 30 * 60 * 1000), // Hace 30 minutos
        endTime: new Date(Date.now() + 60 * 60 * 1000), // En 1 hora
        qrToken: 'valid-qr-token-12345678901234567890123456789012',
        qrTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // Expira en 5 minutos
        topic: 'Test Topic',
      };

      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        studentIds: ['test-student-id'],
      };

      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);
      mockPrisma.attendance.findFirst.mockResolvedValue(null); // No hay asistencia previa
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'attendance-id',
        classId: 'class-id',
        studentId: 'test-student-id',
        status: 'PRESENTE',
        recordedAt: new Date(),
      });

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('message');
      expect(data.data.status).toBe('PRESENTE');
      expect(mockPrisma.attendance.create).toHaveBeenCalled();
    });

    it('debería retornar 401 si no hay sesión', async () => {
      mockSession = null;

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty('error', 'UNAUTHORIZED');
    });

    it('debería retornar 400 si el token QR es inválido o expirado', async () => {
      mockPrisma.class.findFirst.mockResolvedValue(null); // No se encuentra la clase

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'invalid-qr-token-12345678901234567890123456789012', // 32+ caracteres para pasar la validación del schema
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'INVALID_QR_CODE');
    });

    it('debería retornar 403 si el estudiante no está matriculado', async () => {
      const mockClass = {
        id: 'class-id',
        subjectId: 'subject-id',
        date: new Date(),
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        qrToken: 'valid-qr-token-12345678901234567890123456789012',
        qrTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        topic: 'Test Topic',
      };

      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        studentIds: ['other-student-id'], // El estudiante no está matriculado
      };

      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error', 'NOT_ENROLLED');
    });

    it('debería retornar 403 si el usuario no es estudiante', async () => {
      mockSession = {
        user: {
          id: 'test-teacher-id',
          role: 'DOCENTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error', 'FORBIDDEN');
    });

    it('debería retornar 409 si ya se registró la asistencia', async () => {
      const mockClass = {
        id: 'class-id',
        subjectId: 'subject-id',
        date: new Date(),
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
        qrToken: 'valid-qr-token-12345678901234567890123456789012',
        qrTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        topic: 'Test Topic',
      };

      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        studentIds: ['test-student-id'],
      };

      const existingAttendance = {
        id: 'attendance-id',
        classId: 'class-id',
        studentId: 'test-student-id',
      };

      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);
      mockPrisma.attendance.findFirst.mockResolvedValue(existingAttendance);

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toHaveProperty('error', 'ATTENDANCE_ALREADY_RECORDED');
      expect(mockPrisma.attendance.create).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si la clase aún no ha comenzado', async () => {
      // Crear fecha futura para la clase
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1); // En 1 hora

      const mockClass = {
        id: 'class-id',
        subjectId: 'subject-id',
        date: futureDate,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 2 * 60 * 60 * 1000),
        qrToken: 'valid-qr-token-12345678901234567890123456789012',
        qrTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        topic: 'Test Topic',
      };

      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        studentIds: ['test-student-id'],
      };

      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'CLASS_NOT_STARTED');
    });

    it('debería retornar 400 si la clase ya ha finalizado', async () => {
      // Crear fecha pasada para la clase
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 3); // Hace 3 horas

      const mockClass = {
        id: 'class-id',
        subjectId: 'subject-id',
        date: pastDate,
        startTime: pastDate,
        endTime: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000), // Hace 1 hora (finalizó)
        qrToken: 'valid-qr-token-12345678901234567890123456789012',
        qrTokenExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        topic: 'Test Topic',
      };

      const mockSubject = {
        id: 'subject-id',
        name: 'Test Subject',
        studentIds: ['test-student-id'],
      };

      mockPrisma.class.findFirst.mockResolvedValue(mockClass);
      mockPrisma.subject.findUnique.mockResolvedValue(mockSubject);

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'CLASS_ENDED');
    });

    it('debería retornar 400 si el request body es inválido', async () => {
      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          // Falta qrToken o es muy corto
          qrToken: 'short',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error', 'INVALID_REQUEST');
    });

    it('debería retornar 429 si se excede el rate limit', async () => {
      (limiter.check as jest.Mock).mockReturnValue({
        isRateLimited: true,
        limit: 5,
        remaining: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/asistencia/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: 'valid-qr-token-12345678901234567890123456789012',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toHaveProperty('error', 'RATE_LIMITED');
    });
  });
});
