import { Role } from '@prisma/client';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Public paths that don't require authentication
const publicPaths = ['/', '/login', '/logout', '/_next', '/favicon.ico', '/api/auth', '/icons'];

// Role-based dashboard paths
const roleDashboards = {
  [Role.ADMIN]: '/dashboard/admin',
  [Role.DOCENTE]: '/dashboard/docente',
  [Role.ESTUDIANTE]: '/dashboard/estudiante',
  [Role.COORDINADOR]: '/dashboard/coordinador',
} as const;

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Check if it's a public path
    const isPublicPath = publicPaths.some(
      path => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Get token once to avoid multiple calls
    const token = (await getToken({ req })) as { role: Role } | null;

    // Handle login page access
    if (pathname === '/login') {
      if (token) {
        // Redirect authenticated users to their dashboard
        const targetPath = roleDashboards[token.role as Role] || '/';
        return NextResponse.redirect(new URL(targetPath, req.url));
      }
      return NextResponse.next();
    }

    // Handle logout - MEJORADO
    if (pathname === '/logout') {
      const response = NextResponse.redirect(new URL('/login', req.url));

      // Limpiar todas las posibles cookies de NextAuth
      const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
        'next-auth.callback-url',
        '__Secure-next-auth.callback-url',
      ];

      cookieNames.forEach(cookieName => {
        response.cookies.set({
          name: cookieName,
          value: '',
          path: '/',
          expires: new Date(0),
          secure: true,
          httpOnly: true,
          sameSite: 'lax',
        });
      });

      // Agregar headers para evitar caché
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');

      return response;
    }

    // Allow access to public paths
    if (isPublicPath) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const userRole = token.role as Role;

    // Redirect root path to role-specific dashboard
    if (pathname === '/') {
      const targetPath = roleDashboards[userRole] || '/';
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // Redirect generic dashboard to role-specific dashboard
    if (pathname === '/dashboard') {
      const targetPath = roleDashboards[userRole] || '/';
      return NextResponse.redirect(new URL(targetPath, req.url));
    }

    // API Route Protection
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next();

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Admin-only API routes
      if (pathname.startsWith('/api/admin') && userRole !== Role.ADMIN) {
        return new NextResponse(JSON.stringify({ message: 'Unauthorized' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return response;
    }

    // Dashboard route protection
    if (pathname.startsWith('/dashboard/')) {
      // Admin routes
      if (pathname.startsWith('/dashboard/admin') && userRole !== Role.ADMIN) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // Teacher routes
      if (pathname.startsWith('/dashboard/docente') && userRole !== Role.DOCENTE) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // Student routes
      if (pathname.startsWith('/dashboard/estudiante') && userRole !== Role.ESTUDIANTE) {
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons).*)'],
};
