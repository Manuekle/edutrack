'use client';

import { navLinkGroups } from '@/config/navigation';
import type { Role } from '@/types';
import { ChevronDown, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

import { TutorialButton } from '@/components/tutorial-button';
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

function getRoleDisplayName(role: Role) {
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
}

const UserMenuButton = React.forwardRef<
  HTMLButtonElement,
  {
    session: { user?: { name?: string | null } } | null;
    roleDisplayName: string;
  }
>(function UserMenuButton({ session, roleDisplayName }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="w-full flex items-center p-2 sm:p-3 rounded-lg hover:bg-sidebar-accent transition-colors duration-200 active:scale-[0.98] mx-1 sm:mx-2 my-1 min-h-11 sm:min-h-12 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:min-h-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:justify-center"
    >
      <Avatar className="h-8 w-8 sm: sm:w-9 border-2 border-primary/20 sm:text-sm text-xs font-semibold group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary">
          {session?.user?.name?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="ml-2 sm:ml-3 text-left overflow-hidden min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="sm:text-sm text-xs font-semibold truncate font-sans">
          {session?.user?.name?.split(' ')[0] || 'Usuario'}
        </p>
        <p className="text-xs text-muted-foreground truncate font-sans hidden sm:block">
          {roleDisplayName}
        </p>
      </div>
      <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
    </button>
  );
});

function AppSidebar({ homePath }: { homePath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

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

  return (
    <Sidebar
      variant="inset"
      className="h-screen fixed font-sans bg-sidebar/80 backdrop-blur-2xl pt-[env(safe-area-inset-top)]"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="default" asChild className="h-auto py-4 rounded-xl">
              <Link href={homePath}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
                    <img src="/icons/favicon-96x96.png" alt="SIRA" className="w-full h-full" />
                  </div>
                  <div className="grid flex-1 text-left">
                    <span className="truncate font-semibold sm:text-sm text-xs tracking-card">SIRA</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      Facultad de Ingeniería
                    </span>
                  </div>
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
                <SidebarGroupLabel className="px-3 py-2 text-[11px] font-semibold uppercase tracking-card text-muted-foreground/50">
                  {group.title}
                </SidebarGroupLabel>
                <SidebarGroupContent className="flex flex-col gap-1 px-2">
                  {group.links.map(link => {
                    const Icon = link.icon;
                    const isActive = isLinkActive(link.href);
                    return (
                      <SidebarMenuItem key={link.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-out active:scale-[0.97] ${isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                            }`}
                        >
                          <Link href={link.href} className="flex items-center gap-3 w-full">
                            {Icon && (
                              <Icon
                                className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'
                                  }`}
                              />
                            )}
                            <span className="text-[13px]">{link.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20">
        <SidebarMenu>
          <SidebarMenuItem>
            {mounted ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger className="w-full flex items-center p-2 sm:p-3 rounded-xl hover:bg-sidebar-accent transition-all duration-200 active:scale-[0.97] mx-1 sm:mx-2 my-1 min-h-11 sm:min-h-12 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:min-h-0 group-data-[collapsible=icon]:w-9 group-data-[collapsible=icon]:justify-center data-[state=open]:bg-sidebar-accent">
                  <Avatar className="h-8 w-8 sm: sm:w-9 border-2 border-primary/20 sm:text-sm text-xs font-semibold group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {session?.user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2 sm:ml-3 text-left overflow-hidden min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="sm:text-sm text-xs font-semibold truncate font-sans">
                      {session?.user?.name?.split(' ')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate font-sans hidden sm:block">
                      {getRoleDisplayName(userRole as Role)}
                    </p>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="font-sans w-64 sm:w-80"
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  alignOffset={-20}
                  collisionPadding={16}
                >
                  <div className="px-4 py-1.5 my-1">
                    <p className="text-xs font-semibold truncate">
                      {session?.user?.name || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.institutionalEmail || getRoleDisplayName(userRole as Role)}
                    </p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                    className="cursor-pointer gap-2 py-2.5 rounded-lg text-primary focus:bg-primary/10"
                  >
                    <Settings className="mr-3 h-4 w-4 shrink-0 text-foreground" />
                    <span className="text-foreground">Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    aria-label="Cambiar entre modo oscuro y modo claro"
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
                    className="cursor-pointer gap-2 py-2.5 rounded-lg text-primary focus:bg-primary/10"
                  >
                    {theme === 'dark' ||
                      (theme === 'system' &&
                        typeof window !== 'undefined' &&
                        window.matchMedia('(prefers-color-scheme: dark)').matches) ? (
                      <Sun className="mr-3 h-4 w-4 shrink-0 text-foreground" />
                    ) : (
                      <Moon className="mr-3 h-4 w-4 shrink-0 text-foreground" />
                    )}
                    <span className="text-foreground">
                      {theme === 'dark' ||
                        (theme === 'system' &&
                          typeof window !== 'undefined' &&
                          window.matchMedia('(prefers-color-scheme: dark)').matches)
                        ? 'Modo Claro'
                        : 'Modo Oscuro'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer gap-2 py-2.5 rounded-lg text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-3 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-destructive">Cerrar sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <UserMenuButton
                session={session}
                roleDisplayName={getRoleDisplayName(userRole as Role)}
              />
            )}
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
      if (routePattern.includes('[')) {
        const pattern = routePattern.replace(/\[[^\]]+\]/g, '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(currentPath);
      }
      return currentPath === routePattern || currentPath.startsWith(`${routePattern}/`);
    };

    // Resolver patrones dinámicos ([id], [classId], etc.) a URLs reales
    const resolveHref = (routePattern: string, currentPath: string): string => {
      if (!routePattern.includes('[')) return routePattern;
      const patternParts = routePattern.split('/');
      const pathParts = currentPath.split('/');
      return patternParts
        .map((part, i) => (/^\[.+\]$/.test(part) ? pathParts[i] ?? part : part))
        .join('/');
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
          href: resolveHref(parentLink.href, pathname),
          label: parentLink.label,
        });
      }
    }
    // Si no es un subLink pero tiene subLinks, lo añadimos directamente
    else if (!currentLink.isSubLink) {
      // Solo lo añadimos si no es el home
      if (currentLink.href !== homePath) {
        crumbs.push({
          href: resolveHref(currentLink.href, pathname),
          label: currentLink.label,
        });
      }
    }

    // Finalmente, si es un subLink o la ruta actual es un subLink, lo añadimos
    if (currentLink.isSubLink || (currentLink.subLinks && pathname !== currentLink.href)) {
      // Buscar si hay un subLink activo
      const activeSubLink = currentLink.subLinks?.find(
        subLink => isMatchingRoute(subLink.href, pathname)
      );

      if (activeSubLink) {
        crumbs.push({
          href: resolveHref(activeSubLink.href, pathname),
          label: activeSubLink.label,
        });
      } else if (currentLink.isSubLink) {
        // Si es un subLink y no hemos encontrado otro subLink más específico
        crumbs.push({
          href: resolveHref(currentLink.href, pathname),
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
          <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 px-4 sm:px-6 font-sans pt-[env(safe-area-inset-top)] transition-all duration-200">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger className="-ml-1 rounded-xl hover:bg-accent/60 active:scale-95 transition-all" />
              <Breadcrumb className="flex-1 mt-0.5 truncate">
                <BreadcrumbList className="flex-nowrap">
                  {breadcrumbLinks.map((link, index) => (
                    <React.Fragment key={link.href}>
                      <BreadcrumbItem>
                        {index === breadcrumbLinks.length - 1 ? (
                          <BreadcrumbPage className="sm:text-sm text-xs sm:text-xs font-semibold tracking-card">
                            {link.label}
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link
                              href={link.href}
                              className="sm:text-sm text-xs sm:text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                              {link.label}
                            </Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < breadcrumbLinks.length - 1 && <BreadcrumbSeparator />}
                    </React.Fragment>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <TutorialButton />
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-5 md:p-8 font-sans">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
