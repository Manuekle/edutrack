import { redis } from './redis';

export async function clearUserCache(userId: string) {
  try {
    await redis.del(`user:${userId}`);
  } catch {
    // Cache not available, continue (non-critical)
  }
}

export async function clearAuthCache(email: string) {
  try {
    await redis.del(`auth:${email}`);
  } catch {
    // Cache not available, continue (non-critical)
  }
}

// Nueva función para limpiar todo el caché relacionado con un usuario
export async function clearAllUserCache(userId: string, emails: string[]) {
  try {
    const keys = [`user:${userId}`, ...emails.map(email => `auth:${email}`)];
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache not available, continue (non-critical)
  }
}

// Clear dashboard cache for a user
export async function clearDashboardCache(
  userId: string,
  role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN'
) {
  try {
    const cacheKey = `dashboard:${role.toLowerCase()}:${userId}`;
    await redis.del(cacheKey);
  } catch {
    // Cache not available, continue (non-critical)
  }
}

// Clear all dashboard caches for multiple users (useful when data changes)
export async function clearDashboardCachesForUsers(
  userIds: string[],
  role: 'ESTUDIANTE' | 'DOCENTE' | 'ADMIN'
) {
  try {
    if (userIds.length === 0) return;
    const keys = userIds.map(userId => `dashboard:${role.toLowerCase()}:${userId}`);
    await redis.del(...keys);
  } catch {
    // Cache not available, continue (non-critical)
  }
}

// Clear cache for a subject (affects all students and teacher)
export async function clearSubjectCache(subjectId: string) {
  try {
    const { db } = await import('@/lib/prisma');
    // Get the subject with teacher and students
    const subject = await db.subject.findUnique({
      where: { id: subjectId },
      select: {
        teacherId: true,
        studentIds: true,
      },
    });

    if (!subject) return;

    // Clear teacher dashboard cache
    await clearDashboardCache(subject.teacherId, 'DOCENTE');

    // Clear all students' dashboard caches
    if (subject.studentIds.length > 0) {
      await clearDashboardCachesForUsers(subject.studentIds, 'ESTUDIANTE');
    }
  } catch {
    // If cache clearing fails, continue (non-critical)
  }
}
