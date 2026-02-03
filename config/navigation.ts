import type { NavLinkGroup } from '@/types/navigation';
import {
    BookMarked,
    BookOpen,
    GraduationCap,
    Home,
    QrCode,
    Settings,
    TrendingUp,
    User,
    UserPlus,
    Users,
} from 'lucide-react';

export const navLinkGroups: NavLinkGroup[] = [
  {
    title: 'Panel Principal',
    icon: Home,
    links: [
      {
        href: '/dashboard',
        icon: Home,
        label: 'Inicio',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Vista general del sistema',
      },
      {
        href: '/dashboard/profile',
        icon: User,
        label: 'Perfil',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Gestiona tu información personal',
      },
    ],
  },
  {
    title: 'Área Estudiantil',
    roles: ['ESTUDIANTE'],
    icon: GraduationCap,
    links: [
      {
        href: '/dashboard/estudiante/asistencia',
        icon: QrCode,
        label: 'Asistencia',
        roles: ['ESTUDIANTE'],
        description: 'Escanear código QR para asistencia',
      },
      {
        href: '/dashboard/estudiante/historial',
        icon: TrendingUp,
        label: 'Historial de Asistencias',
        roles: ['ESTUDIANTE'],
        description: 'Consulta tus asistencias',
      },
      {
        href: '/dashboard/estudiante/escanear',
        icon: QrCode,
        label: 'Escanear',
        roles: ['ESTUDIANTE'],
        description: 'Escanear código QR para asistencia',
      },
    ],
  },
  {
    title: 'Área Docente',
    roles: ['DOCENTE'],
    icon: BookOpen,
    links: [
      {
        href: '/dashboard/docente/asignaturas',
        icon: BookMarked,
        label: 'Mis Asignaturas',
        roles: ['DOCENTE'],
        description: 'Gestiona tus asignaturas y estudiantes',
        subLinks: [
          {
            href: '/dashboard/docente/asignaturas/[id]',
            label: 'Mis Clases',
            description: 'Gestiona tus clases y eventos.',
            roles: ['DOCENTE'],
            isSubLink: true,
            parentHref: '/dashboard/docente/asignaturas/[id]',
            icon: BookMarked,
          },
          {
            href: '/dashboard/docente/asignaturas/[id]/clase/[classId]/asistencia',
            label: 'Asistencia',
            description: 'Gestiona la asistencia de tus estudiantes.',
            roles: ['DOCENTE'],
            isSubLink: true,
            parentHref: '/dashboard/docente/asignaturas/[id]/clase/[classId]/asistencia',
            icon: QrCode,
          },
        ],
      },

      {
        href: '/dashboard/docente/reportes',
        icon: TrendingUp,
        label: 'Mis Reportes',
        roles: ['DOCENTE'],
        description: 'Ver y generar reportes de asistencia',
      },
    ],
  },
  {
    title: 'Administración',
    roles: ['ADMIN'],
    icon: Settings,
    links: [
      {
        href: '/dashboard/admin/usuarios',
        icon: Users,
        label: 'Gestión de Usuarios',
        roles: ['ADMIN'],
        description: 'Administrar cuentas de usuario',
        subLinks: [
          {
            href: '/dashboard/admin/docentes/cargar',
            label: 'Cargar Docentes',
            description: 'Cargar docentes desde archivo Excel',
            roles: ['ADMIN'],
            isSubLink: true,
            parentHref: '/dashboard/admin/docentes/cargar',
            icon: BookOpen,
          },
          {
            href: '/dashboard/admin/estudiantes/cargar',
            label: 'Cargar Estudiantes',
            description: 'Cargar estudiantes desde archivo Excel',
            roles: ['ADMIN'],
            isSubLink: true,
            parentHref: '/dashboard/admin/estudiantes/cargar',
            icon: GraduationCap,
          },
        ],
      },
      {
        href: '/dashboard/admin/asignaturas',
        icon: BookMarked,
        label: 'Gestión de Asignaturas',
        roles: ['ADMIN'],
        description: 'Administrar asignaturas',
      },
      {
        href: '/dashboard/admin/matricula',
        icon: UserPlus,
        label: 'Matrícula',
        roles: ['ADMIN'],
        description: 'Gestionar matrículas',
        subLinks: [
          {
            href: '/dashboard/admin/matricula/cargar',
            label: 'Cargar Matrículas',
            description: 'Matricular estudiantes masivamente desde Excel',
            roles: ['ADMIN'],
            isSubLink: true,
            parentHref: '/dashboard/admin/matricula/cargar',
            icon: UserPlus,
          },
        ],
      },
      {
        href: '/dashboard/admin/reportes',
        icon: TrendingUp,
        label: 'Reportes Docentes',
        roles: ['ADMIN'],
        description: 'Reportes generales de docentes',
      },
    ],
  },
];
