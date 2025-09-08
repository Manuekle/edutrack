import { redis } from './redis';

export async function clearUserCache(userId: string) {
  await redis.del(`user:${userId}`);
}

export async function clearAuthCache(email: string) {
  await redis.del(`auth:${email}`);
}

// Nueva función para limpiar todo el caché relacionado con un usuario
export async function clearAllUserCache(userId: string, emails: string[]) {
  const keys = [`user:${userId}`, ...emails.map(email => `auth:${email}`)];
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
