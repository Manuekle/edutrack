/**
 * Tests para la API de usuarios
 * Tests completos con mocks de Next.js y Prisma
 */

import { GET, POST } from '@/app/api/admin/users/route';
import { PATCH, DELETE } from '@/app/api/admin/users/[userId]/route';
import { NextRequest } from 'next/server';

// Mock de @prisma/client para el error de Prisma (solo lo necesario)
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  class PrismaClientKnownRequestError extends Error {
    code = 'P2003';
    meta?: unknown;
    constructor(message: string, meta?: unknown) {
      super(message);
      this.name = 'PrismaClientKnownRequestError';
      this.code = 'P2003';
      this.meta = meta;
    }
  }

  return {
    ...actual,
    Prisma: {
      ...actual.Prisma,
      PrismaClientKnownRequestError,
    },
  };
});

// Mock de Prisma - debe ser definido antes de los mocks
jest.mock('@/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
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

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed_${password}`)),
}));

// Importar después de los mocks
const { db } = require('@/lib/prisma');
const mockPrisma = db;

describe('API /api/admin/users', () => {
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

  describe('GET /api/admin/users', () => {
    it('debería retornar una lista de usuarios con paginación', async () => {
      const mockUsers = [
        {
          id: '1',
          name: 'Test User',
          correoPersonal: 'test@example.com',
          correoInstitucional: 'test@institution.com',
          role: 'ESTUDIANTE',
          isActive: true,
          createdAt: new Date(),
          document: '1234567890',
          telefono: '1234567890',
          codigoEstudiantil: null,
          codigoDocente: null,
        },
      ];

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/admin/users?page=1&limit=10');
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
      expect(data.pagination).toHaveProperty('totalPages', 1);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
      expect(mockPrisma.user.count).toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error', 'Acceso denegado');
      expect(mockPrisma.user.findMany).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si no hay sesión', async () => {
      mockSession = null;

      const request = new NextRequest('http://localhost:3000/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('error', 'Acceso denegado');
    });

    it('debería filtrar usuarios por rol', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users?role=ESTUDIANTE&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'ESTUDIANTE',
          }),
        })
      );
    });

    it('debería filtrar usuarios por búsqueda', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/users?search=test&page=1&limit=10'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('debería validar parámetros de paginación', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/admin/users?page=0&limit=200');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // La página debe ser al menos 1
      expect(data.pagination.page).toBeGreaterThanOrEqual(1);
      // El límite debe ser máximo 100
      expect(data.pagination.limit).toBeLessThanOrEqual(100);
    });
  });

  describe('POST /api/admin/users', () => {
    it('debería crear un nuevo usuario', async () => {
      const newUser = {
        id: 'new-user-id',
        name: 'New User',
        correoPersonal: 'newuser@example.com',
        correoInstitucional: null,
        role: 'ESTUDIANTE',
        isActive: true,
        createdAt: new Date(),
        document: null,
        telefono: null,
        codigoEstudiantil: null,
        codigoDocente: null,
        password: 'hashed_password123',
      };

      mockPrisma.user.findFirst.mockResolvedValue(null); // No existe usuario con ese correo
      mockPrisma.user.create.mockResolvedValue(newUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          correoPersonal: 'newuser@example.com',
          password: 'password123',
          role: 'ESTUDIANTE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).not.toHaveProperty('password');
      expect(data.name).toBe('New User');
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          // Falta password y role
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('message');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('debería retornar 400 si no se proporciona ningún correo', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          password: 'password123',
          role: 'ESTUDIANTE',
          // No hay correoPersonal ni correoInstitucional
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('correo');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('debería retornar 409 si el correo ya está en uso', async () => {
      const existingUser = {
        id: 'existing-user-id',
        name: 'Existing User',
        correoPersonal: 'existing@example.com',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          correoPersonal: 'existing@example.com',
          password: 'password123',
          role: 'ESTUDIANTE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('correo');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          correoPersonal: 'newuser@example.com',
          password: 'password123',
          role: 'ESTUDIANTE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('debería hashear la contraseña antes de guardarla', async () => {
      const bcrypt = require('bcryptjs');
      const newUser = {
        id: 'new-user-id',
        name: 'New User',
        correoPersonal: 'newuser@example.com',
        password: 'hashed_password123',
        role: 'ESTUDIANTE',
        isActive: true,
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New User',
          correoPersonal: 'newuser@example.com',
          password: 'password123',
          role: 'ESTUDIANTE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await POST(request);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'hashed_password123',
          }),
        })
      );
    });
  });

  describe('PATCH /api/admin/users/[userId]', () => {
    it('debería actualizar un usuario existente', async () => {
      const updatedUser = {
        id: 'user-id',
        name: 'Updated User',
        correoPersonal: 'updated@example.com',
        correoInstitucional: 'updated@institution.com',
        role: 'ESTUDIANTE',
        isActive: true,
        document: '1234567890',
        telefono: '1234567890',
        codigoEstudiantil: 'E001',
        codigoDocente: null,
        createdAt: new Date(),
      };

      mockPrisma.user.findFirst.mockResolvedValue(null); // No hay otro usuario con ese correo
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated User',
          correoPersonal: 'updated@example.com',
          role: 'ESTUDIANTE',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated User');
      expect(data).not.toHaveProperty('password');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('debería retornar 400 si no se proporciona ningún correo', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated User',
          correoPersonal: '',
          correoInstitucional: '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('correo');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('debería retornar 409 si el correo ya está en uso por otro usuario', async () => {
      const existingUser = {
        id: 'other-user-id',
        correoPersonal: 'existing@example.com',
      };

      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'PATCH',
        body: JSON.stringify({
          correoPersonal: 'existing@example.com',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('correo');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated User',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await PATCH(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/admin/users/[userId]', () => {
    it('debería eliminar un usuario existente', async () => {
      mockPrisma.user.delete.mockResolvedValue({ id: 'user-id' });

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('message', 'Usuario eliminado con éxito');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
    });

    it('debería retornar 400 si se intenta eliminar la propia cuenta', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/users/test-admin-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ userId: 'test-admin-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('No puedes eliminar tu propia cuenta');
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });

    it('debería retornar 409 si el usuario tiene registros asociados', async () => {
      const { Prisma } = require('@prisma/client');
      // Crear una instancia del error de Prisma usando la clase mockeada
      const error = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
      });

      mockPrisma.user.delete.mockRejectedValue(error);

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.message).toContain('registros asociados');
    });

    it('debería retornar 403 si el usuario no es ADMIN', async () => {
      mockSession = {
        user: {
          id: 'test-user-id',
          role: 'ESTUDIANTE',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-id', {
        method: 'DELETE',
      });

      const response = await DELETE(request, {
        params: Promise.resolve({ userId: 'user-id' }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toHaveProperty('message', 'Acceso denegado');
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});
