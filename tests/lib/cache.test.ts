/**
 * Tests para lib/cache.ts
 */

import {
  clearUserCache,
  clearAuthCache,
  clearAllUserCache,
  clearDashboardCache,
  clearDashboardCachesForUsers,
  clearSubjectCache,
} from '@/lib/cache';
import { redis } from '@/lib/redis';

// Mock de redis
jest.mock('@/lib/redis', () => ({
  redis: {
    del: jest.fn(),
  },
}));

// Mock de Prisma
jest.mock('@/lib/prisma', () => ({
  db: {
    subject: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Cache Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clearUserCache', () => {
    it('debería eliminar el caché del usuario correctamente', async () => {
      const userId = 'user123';
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearUserCache(userId);

      expect(redis.del).toHaveBeenCalledWith(`user:${userId}`);
      expect(redis.del).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores silenciosamente', async () => {
      const userId = 'user123';
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // No debería lanzar error
      await expect(clearUserCache(userId)).resolves.not.toThrow();
    });
  });

  describe('clearAuthCache', () => {
    it('debería eliminar el caché de autenticación correctamente', async () => {
      const email = 'test@example.com';
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearAuthCache(email);

      expect(redis.del).toHaveBeenCalledWith(`auth:${email}`);
      expect(redis.del).toHaveBeenCalledTimes(1);
    });

    it('debería manejar errores silenciosamente', async () => {
      const email = 'test@example.com';
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(clearAuthCache(email)).resolves.not.toThrow();
    });
  });

  describe('clearAllUserCache', () => {
    it('debería eliminar todos los cachés relacionados con un usuario', async () => {
      const userId = 'user123';
      const emails = ['test1@example.com', 'test2@example.com'];
      (redis.del as jest.Mock).mockResolvedValue(3);

      await clearAllUserCache(userId, emails);

      expect(redis.del).toHaveBeenCalledWith(
        `user:${userId}`,
        `auth:${emails[0]}`,
        `auth:${emails[1]}`
      );
      expect(redis.del).toHaveBeenCalledTimes(1);
    });

    it('debería manejar arrays vacíos de emails', async () => {
      const userId = 'user123';
      const emails: string[] = [];
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearAllUserCache(userId, emails);

      expect(redis.del).toHaveBeenCalledWith(`user:${userId}`);
    });

    it('debería manejar errores silenciosamente', async () => {
      const userId = 'user123';
      const emails = ['test@example.com'];
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(clearAllUserCache(userId, emails)).resolves.not.toThrow();
    });
  });

  describe('clearDashboardCache', () => {
    it('debería eliminar el caché del dashboard para ESTUDIANTE', async () => {
      const userId = 'user123';
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'ESTUDIANTE';
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearDashboardCache(userId, role);

      expect(redis.del).toHaveBeenCalledWith(`dashboard:estudiante:${userId}`);
    });

    it('debería eliminar el caché del dashboard para DOCENTE', async () => {
      const userId = 'user123';
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'DOCENTE';
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearDashboardCache(userId, role);

      expect(redis.del).toHaveBeenCalledWith(`dashboard:docente:${userId}`);
    });

    it('debería eliminar el caché del dashboard para ADMIN', async () => {
      const userId = 'user123';
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'ADMIN';
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearDashboardCache(userId, role);

      expect(redis.del).toHaveBeenCalledWith(`dashboard:admin:${userId}`);
    });

    it('debería manejar errores silenciosamente', async () => {
      const userId = 'user123';
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'ESTUDIANTE';
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(clearDashboardCache(userId, role)).resolves.not.toThrow();
    });
  });

  describe('clearDashboardCachesForUsers', () => {
    it('debería eliminar los cachés del dashboard para múltiples usuarios', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'ESTUDIANTE';
      (redis.del as jest.Mock).mockResolvedValue(3);

      await clearDashboardCachesForUsers(userIds, role);

      expect(redis.del).toHaveBeenCalledWith(
        'dashboard:estudiante:user1',
        'dashboard:estudiante:user2',
        'dashboard:estudiante:user3'
      );
    });

    it('debería retornar temprano si el array de usuarios está vacío', async () => {
      const userIds: string[] = [];
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'ESTUDIANTE';

      await clearDashboardCachesForUsers(userIds, role);

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('debería manejar errores silenciosamente', async () => {
      const userIds = ['user1', 'user2'];
      const role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN' = 'DOCENTE';
      (redis.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      await expect(clearDashboardCachesForUsers(userIds, role)).resolves.not.toThrow();
    });
  });

  describe('clearSubjectCache', () => {
    it('debería limpiar el caché del docente y estudiantes cuando existe la asignatura', async () => {
      const subjectId = 'subject123';
      const mockSubject = {
        teacherId: 'teacher123',
        studentIds: ['student1', 'student2'],
      };

      const { db } = await import('@/lib/prisma');
      (db.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearSubjectCache(subjectId);

      expect(db.subject.findUnique).toHaveBeenCalledWith({
        where: { id: subjectId },
        select: {
          teacherId: true,
          studentIds: true,
        },
      });

      // Verificar que se llamó clearDashboardCache para el docente
      expect(redis.del).toHaveBeenCalledWith('dashboard:docente:teacher123');
      // Verificar que se llamó clearDashboardCachesForUsers para los estudiantes
      expect(redis.del).toHaveBeenCalledWith(
        'dashboard:estudiante:student1',
        'dashboard:estudiante:student2'
      );
    });

    it('debería retornar temprano si la asignatura no existe', async () => {
      const subjectId = 'subject123';

      const { db } = await import('@/lib/prisma');
      (db.subject.findUnique as jest.Mock).mockResolvedValue(null);

      await clearSubjectCache(subjectId);

      expect(db.subject.findUnique).toHaveBeenCalled();
      // No debería llamar a redis.del si no hay asignatura
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('debería manejar asignaturas sin estudiantes', async () => {
      const subjectId = 'subject123';
      const mockSubject = {
        teacherId: 'teacher123',
        studentIds: [],
      };

      const { db } = await import('@/lib/prisma');
      (db.subject.findUnique as jest.Mock).mockResolvedValue(mockSubject);
      (redis.del as jest.Mock).mockResolvedValue(1);

      await clearSubjectCache(subjectId);

      expect(redis.del).toHaveBeenCalledWith('dashboard:docente:teacher123');
      // No debería llamar para estudiantes si el array está vacío
    });

    it('debería manejar errores silenciosamente', async () => {
      const subjectId = 'subject123';

      const { db } = await import('@/lib/prisma');
      (db.subject.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(clearSubjectCache(subjectId)).resolves.not.toThrow();
    });
  });
});
