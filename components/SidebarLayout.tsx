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
import Image from 'next/image';

function AppSidebar({ homePath }: { homePath: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      // Primero redirigir a la raíz para evitar el callbackUrl
      window.location.href = '/';
      // Luego cerrar sesión
      await signOut({ redirect: false });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
            <SidebarMenuButton size="lg" asChild>
              <Link href={homePath}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                  <Image
                    src="/icons/favicon-192x192.png"
                    alt="Sistema de Gestión de Asistencias"
                    width={32}
                    height={32}
                    priority
                    className="h-full w-auto"
                    quality={100}
                  />
                </div>
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
                <button className="w-full flex items-center p-2 hover:bg-sidebar-accent transition-colors">
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
                  <Settings className="mr-3 h-4 w-4 flex-shrink-0" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="cursor-pointer py-1 my-1  px-4 text-xs flex items-center"
                >
                  {theme === 'dark' ? (
                    <Sun className="mr-3 h-4 w-4 flex-shrink-0" />
                  ) : (
                    <Moon className="mr-3 h-4 w-4 flex-shrink-0" />
                  )}
                  <span className="font-sans">
                    {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                  </span>
                </DropdownMenuItem>
                <Separator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive cursor-pointer py-1 mt-1 px-4 text-xs flex items-center"
                >
                  <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
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

    const allLinks = navLinkGroups.flatMap(group =>
      group.links.filter(link => link.roles.includes(userRole))
    );

    const sortedLinks = allLinks.sort((a, b) => b.href.length - a.href.length);
    const currentLink = sortedLinks.find(link => pathname.startsWith(link.href));

    const crumbs = [{ href: homePath, label: 'Dashboard' }];
    if (currentLink && currentLink.href !== homePath) {
      crumbs.push(currentLink);
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
