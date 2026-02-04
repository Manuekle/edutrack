'use client';

import { navLinkGroups } from '@/config/navigation';
import type { Role } from '@/types';
import { ChevronDown, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

function AppSidebar({ homePath }: { homePath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      // Guardar el tema actual antes de limpiar (tanto del estado como del localStorage)
      let themeToPreserve: string | null = null;
      if (typeof window !== 'undefined') {
        // Priorizar el tema del estado actual, si no existe, usar el del localStorage
        themeToPreserve = theme || localStorage.getItem('theme') || 'system';
        // Guardar explícitamente en localStorage para asegurar que persista
        localStorage.setItem('theme', themeToPreserve);
      }

      // Llamar a API para limpiar caché
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => { }); // No bloqueamos si falla

      // Cerrar sesión en NextAuth
      await signOut({
        redirect: false,
        callbackUrl: '/login',
      });

      // Limpiar estado local pero preservar el tema
      if (typeof window !== 'undefined') {
        // Obtener todas las claves del localStorage
        const allKeys = Object.keys(localStorage);

        // Eliminar todas las claves excepto 'theme'
        allKeys.forEach(key => {
          if (key !== 'theme') {
            localStorage.removeItem(key);
          }
        });

        // Restaurar el tema después de limpiar (por si acaso se perdió)
        if (themeToPreserve) {
          localStorage.setItem('theme', themeToPreserve);
        }

        // Limpiar sessionStorage completamente (no contiene tema)
        sessionStorage.clear();
      }

      // Forzar redirección
      window.location.href = '/login';
    } catch (error) {
      // En caso de error, también preservar el tema
      if (typeof window !== 'undefined' && theme) {
        localStorage.setItem('theme', theme);
      }
      window.location.href = '/login';
    }
  };

  const userRole = session?.user?.role as Role | undefined;

  const accessibleNavGroups = React.useMemo(() => {
    if (status === 'loading' || !userRole) return [];
    return navLinkGroups
      .map(group => ({
        ...group,
        links: group.links.filter(link => link.roles.includes(userRole)),
      }))
      .filter(group => group.links.length > 0);
  }, [userRole, status]);

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const getRoleDisplayName = (role: Role) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'DOCENTE':
        return 'Docente';
      case 'ESTUDIANTE':
        return 'Estudiante';
      default:
        return 'Usuario';
    }
  };

  return (
    <Sidebar variant="inset" className="h-screen fixed font-sans">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="sm" asChild>
              <Link href={homePath}>

                <div className="grid flex-1 text-left text-xs leading-tight">
                  <span className="truncate font-semibold">Gestion de Asistencias</span>
                  <span className="truncate text-xs">Facultad de Ingeniería</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {status === 'loading' ? (
          <SidebarMenu>
            {Array.from({ length: 4 }).map((_, index) => (
              <SidebarMenuItem key={index}>
                <div className="flex items-center gap-3 p-2">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                </div>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            {accessibleNavGroups.map(group => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-1">
                  {group.links.map(link => (
                    <SidebarMenuItem key={link.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isLinkActive(link.href)}
                        className="flex items-center gap-2"
                      >
                        <Link href={link.href}>
                          {/* <link.icon className="size-4" /> */}
                          <span className="text-xs">{link.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
                  <Avatar className="h-8 w-8 border border-zinc-200 dark:border-zinc-700 text-xs">
                    <AvatarFallback>{session?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3 text-left overflow-hidden">
                    <p className="text-xs font-normal truncate font-sans">
                      {session?.user?.name?.split(' ')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-sans">
                      {getRoleDisplayName(userRole as Role)}
                    </p>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="font-sans w-80 sm:w-64"
                side="bottom"
                align="end"
                sideOffset={8}
                alignOffset={-20}
                collisionPadding={16}
              >
                <div className="px-4 py-1 my-1">
                  <p className="text-xs font-medium truncate">{session?.user?.name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.correoInstitucional || getRoleDisplayName(userRole as Role)}
                  </p>
                </div>
                <Separator />
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}
                  className="cursor-pointer py-1 mt-1 px-4 text-xs flex items-center"
                >
                  <Settings className="mr-3 h-4 w-4 shrink-0" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={e => {
                    e.preventDefault();
                    // Determinar el tema actual efectivo (si es 'system', detectar el modo del sistema)
                    let currentEffectiveTheme = theme;
                    if (theme === 'system' && typeof window !== 'undefined') {
                      currentEffectiveTheme = window.matchMedia('(prefers-color-scheme: dark)')
                        .matches
                        ? 'dark'
                        : 'light';
                    }
                    // Cambiar entre dark y light (nunca volver a system desde aquí)
                    const newTheme = currentEffectiveTheme === 'dark' ? 'light' : 'dark';
                    setTheme(newTheme);
                    // next-themes ya guarda automáticamente, pero aseguramos persistencia
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('theme', newTheme);
                    }
                  }}
                  className="cursor-pointer py-1 my-1 px-4 text-xs flex items-center"
                >
                  {theme === 'dark' ||
                    (theme === 'system' &&
                      typeof window !== 'undefined' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
                    <Sun className="mr-3 h-4 w-4 shrink-0" />
                  ) : (
                    <Moon className="mr-3 h-4 w-4 shrink-0" />
                  )}
                  <span className="font-sans">
                    {theme === 'dark' ||
                      (theme === 'system' &&
                        typeof window !== 'undefined' &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches)
                      ? 'Modo Claro'
                      : 'Modo Oscuro'}
                  </span>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer py-1 mt-1 px-4 text-xs flex items-center"
                >
                  <LogOut className="mr-3 h-4 w-4 shrink-0" />
                  <span className="font-sans">Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role as Role | undefined;

  const homePath = React.useMemo(() => {
    switch (userRole) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'DOCENTE':
        return '/dashboard/docente';
      case 'ESTUDIANTE':
        return '/dashboard/estudiante';
      default:
        return '/';
    }
  }, [userRole]);

  const breadcrumbLinks = React.useMemo(() => {
    if (!userRole) return [];

    // Función para aplanar todos los enlaces, incluyendo los subLinks
    const getAllLinks = () => {
      return navLinkGroups.flatMap(group =>
        group.links
          .filter(link => link.roles.includes(userRole))
          .flatMap(link => {
            const result = [{ ...link, isSubLink: false }];
            if (link.subLinks) {
              result.push(
                ...link.subLinks
                  .filter(subLink => subLink.roles.includes(userRole))
                  .map(subLink => ({
                    ...subLink,
                    parentHref: link.href,
                    isSubLink: true,
                    icon: subLink.icon || link.icon, // Provide a fallback icon from parent
                  }))
              );
            }
            return result;
          })
      );
    };

    const allLinks = getAllLinks();

    // Función para verificar si una ruta coincide con un patrón de ruta dinámica
    const isMatchingRoute = (routePattern: string, currentPath: string) => {
      // Si la ruta incluye [id], la convertimos en un patrón de expresión regular
      if (routePattern.includes('[id]')) {
        const pattern = routePattern.replace(/\[id\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}(?:/|$)`);
        return regex.test(currentPath);
      }
      // Para rutas estáticas, comparación normal
      return currentPath === routePattern || currentPath.startsWith(`${routePattern}/`);
    };

    // Encontrar el enlace que mejor coincida con la ruta actual
    const currentLink = allLinks
      .sort((a, b) => b.href.length - a.href.length)
      .find(link => isMatchingRoute(link.href, pathname));

    const crumbs = [{ href: homePath, label: 'Dashboard' }];

    if (!currentLink) return crumbs;

    // Si es un subLink, añadimos primero su padre
    if (currentLink.isSubLink && currentLink.parentHref) {
      const parentLink = allLinks.find(
        link => !link.isSubLink && link.href === currentLink.parentHref
      );
      if (parentLink) {
        crumbs.push({
          href: parentLink.href,
          label: parentLink.label,
        });
      }
    }
    // Si no es un subLink pero tiene subLinks, lo añadimos directamente
    else if (!currentLink.isSubLink) {
      // Solo lo añadimos si no es el home
      if (currentLink.href !== homePath) {
        crumbs.push({
          href: currentLink.href,
          label: currentLink.label,
        });
      }
    }

    // Finalmente, si es un subLink o la ruta actual es un subLink, lo añadimos
    if (currentLink.isSubLink || (currentLink.subLinks && pathname !== currentLink.href)) {
      // Buscar si hay un subLink activo
      const activeSubLink = currentLink.subLinks?.find(
        subLink => pathname === subLink.href || pathname.startsWith(`${subLink.href}/`)
      );

      if (activeSubLink) {
        crumbs.push({
          href: activeSubLink.href,
          label: activeSubLink.label,
        });
      } else if (currentLink.isSubLink) {
        // Si es un subLink y no hemos encontrado otro subLink más específico
        crumbs.push({
          href: currentLink.href,
          label: currentLink.label,
        });
      }
    }

    return crumbs;
  }, [pathname, userRole, homePath]);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar homePath={homePath} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 font-sans">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbLinks.map((link, index) => (
                  <React.Fragment key={link.href}>
                    <BreadcrumbItem>
                      {index === breadcrumbLinks.length - 1 ? (
                        <BreadcrumbPage>{link.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={link.href}>{link.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbLinks.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-4 sm:p-6 font-sans">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
