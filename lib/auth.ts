import { db } from '@/lib/prisma';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { clearUserCache } from './cache';
import { CACHE_TTL, redis } from './redis';

// 🔧 Configuración según entorno
const isProduction = process.env.NODE_ENV === 'production';
let baseUrl = process.env.NEXTAUTH_URL || 'https://edutrack-fup.vercel.app';

if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
  baseUrl = `https://${baseUrl}`;
}

const useSecureCookies = baseUrl.startsWith('https://') || isProduction;
const cookiePrefix = useSecureCookies ? '__Secure-' : '';

export const authOptions: NextAuthOptions = {
  debug: !isProduction,

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Correo Electrónico', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check cache first
        const cacheKey = `auth:${credentials.email}`;
        const cachedAuth = await redis.get(cacheKey);

        if (cachedAuth && typeof cachedAuth === 'string') {
          try {
            const { user, hash } = JSON.parse(cachedAuth);
            const isValid = await bcrypt.compare(credentials.password, hash);
            return isValid ? user : null;
          } catch (error) {
            return null;
          }
        }

        // Not in cache, check database
        const user = await db.user.findFirst({
          where: {
            OR: [{ correoPersonal: credentials.email }, { correoInstitucional: credentials.email }],
          },
          select: {
            id: true,
            role: true,
            name: true,
            correoPersonal: true,
            correoInstitucional: true,
            signatureUrl: true,
            codigoDocente: true,
            codigoEstudiantil: true,
            telefono: true,
            document: true,
            isActive: true,
            password: true,
          },
        });

        if (!user || !user.password) return null;

        const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordCorrect) return null;

        // Prepare user data for session (exclude password)
        const { password, ...userData } = user;

        // Cache successful login
        await redis.set(
          cacheKey,
          JSON.stringify({
            user: userData,
            hash: user.password,
          }),
          { ex: CACHE_TTL.AUTH }
        );

        return userData;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },

  secret: process.env.NEXTAUTH_SECRET,

  events: {
    async signOut({ token }) {
      // Limpiar caché cuando se cierre sesión
      if (token?.id) {
        await clearUserCache(token.id as string);
      }
    },
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        // Cache user data on sign in
        const userData = {
          id: user.id,
          role: user.role,
          name: user.name,
          correoPersonal: user.correoPersonal,
          correoInstitucional: user.correoInstitucional,
          signatureUrl: user.signatureUrl,
          codigoDocente: user.codigoDocente,
          codigoEstudiantil: user.codigoEstudiantil,
          telefono: user.telefono,
          document: user.document,
          isActive: user.isActive,
        };

        await redis.set(`user:${user.id}`, JSON.stringify(userData), {
          ex: CACHE_TTL.USER_SESSION,
        });
        return { ...token, ...userData };
      }

      if (trigger === 'update') {
        // Try cache first
        const cachedUser = await redis.get(`user:${token.id}`);
        if (cachedUser && typeof cachedUser === 'string') {
          try {
            const parsedUser = JSON.parse(cachedUser);
            return { ...token, ...parsedUser };
          } catch (error) {
            // Error parsing cached user, fallback to database
          }
        }

        // Fallback to database
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            role: true,
            name: true,
            correoPersonal: true,
            correoInstitucional: true,
            signatureUrl: true,
            codigoDocente: true,
            codigoEstudiantil: true,
            telefono: true,
            document: true,
            isActive: true,
          },
        });

        if (dbUser) {
          await redis.set(`user:${token.id}`, JSON.stringify(dbUser), {
            ex: CACHE_TTL.USER_SESSION,
          });
          return { ...token, ...dbUser };
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id as string,
          role: token.role as Role,
          name: token.name as string,
          correoPersonal: token.correoPersonal as string,
          correoInstitucional: token.correoInstitucional as string,
          signatureUrl: token.signatureUrl as string | null,
          codigoDocente: token.codigoDocente as string | null,
          codigoEstudiantil: token.codigoEstudiantil as string | null,
          telefono: token.telefono as string | null,
          document: token.document as string | null,
          isActive: token.isActive as boolean,
        };
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirección segura dentro del dominio
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },

  pages: {
    signIn: '/login',
    error: '/auth/error', // ⚠️ Página separada para evitar bucles
    signOut: '/login',
    verifyRequest: '/login',
    newUser: '/login',
  },

  cookies: {
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: useSecureCookies,
        domain: isProduction ? '.edutrack-fup.vercel.app' : undefined,
      },
    },
  },

  theme: {
    colorScheme: 'light',
    logo: '/logo.png',
  },
};
