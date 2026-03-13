import type { NavLinkGroup } from '@/types/navigation';
import {
  BookMarked,
  BookOpen,
  BookText,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  History,
  Home,
  Layout,
  LayoutDashboard,
  NotebookPen,
  QrCode,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

export const navLinkGroups: NavLinkGroup[] = [
  // ─────────────────────────────────────────
  // Panel Principal (todos los roles)
  // ─────────────────────────────────────────
  {
    title: 'Panel Principal',
    icon: Home,
    links: [
      {
        href: '/dashboard',
        icon: LayoutDashboard,
        label: 'Inicio',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Métricas y estado general del sistema',
      },
      {
        href: '/dashboard/profile',
        icon: User,
        label: 'Perfil',
        roles: ['ADMIN', 'DOCENTE', 'ESTUDIANTE'],
        description: 'Gestiona tu información personal',
      },
      {
        href: '/dashboard/admin/usuarios',
        icon: Users,
        label: 'Usuarios',
        roles: ['ADMIN'],
        description: 'Administrar usuarios del sistema',
      },
    ],
  },

  // ─────────────────────────────────────────
  // MICROCURRÍCULO (Admin)
  // ─────────────────────────────────────────
  {
    title: 'Microcurrículo',
    roles: ['ADMIN'],
    icon: BookText,
    links: [
      {
        href: '/dashboard/admin/microcurriculo',
        icon: BookText,
        label: 'Microcurrículo',
        roles: ['ADMIN'],
        description: 'Cargar y gestionar el catálogo de asignaturas',
      },
    ],
  },

  // ─────────────────────────────────────────
  // PLANEADOR ACADÉMICO (Admin) — Orden: Inicio → 1 Horarios → 2 Grupos → 3 Asignación → 4 Planeación
  // ─────────────────────────────────────────
  {
    title: 'Planeador académico',
    roles: ['ADMIN'],
    icon: CalendarDays,
    links: [
      {
        href: '/dashboard/admin/planeador/horarios',
        icon: CalendarDays,
        label: '1. Programación',
        roles: ['ADMIN'],
        description: 'Carga masiva de horarios y creación de grupos',
      },
      {
        href: '/dashboard/admin/planeador/asignacion',
        icon: ClipboardList,
        label: '2. Ajustes',
        roles: ['ADMIN'],
        description: 'Asignar sala, docentes y estudiantes a cada grupo',
      },
      {
        href: '/dashboard/admin/planeador/planeacion',
        icon: LayoutDashboard,
        label: '3. Planeación',
        roles: ['ADMIN'],
        description: 'Generar el calendario de 16 semanas para cada grupo',
      },
    ],
  },

  // ─────────────────────────────────────────
  // SALAS Y RESERVAS (Admin)
  // ─────────────────────────────────────────
  {
    title: 'Salas',
    roles: ['ADMIN'],
    icon: Layout,
    links: [
      {
        href: '/dashboard/admin/salas',
        icon: Layout,
        label: 'Salas',
        roles: ['ADMIN'],
        description: 'Administrar salas y ver reservas en el calendario',
      },
    ],
  },

  // ─────────────────────────────────────────
  // REPORTES (Admin)
  // ─────────────────────────────────────────
  {
    title: 'Reportes',
    roles: ['ADMIN'],
    icon: TrendingUp,
    links: [
      {
        href: '/dashboard/admin/reportes',
        icon: TrendingUp,
        label: 'Reportes',
        roles: ['ADMIN'],
        description: 'Ver reportes de avance por docente y asignatura',
      },
    ],
  },

  // ─────────────────────────────────────────
  // PANEL DOCENTE
  // ─────────────────────────────────────────
  {
    title: 'Panel Docente',
    roles: ['DOCENTE'],
    icon: BookOpen,
    links: [
      {
        href: '/dashboard/docente/grupos',
        icon: Users,
        label: 'Mis Grupos',
        roles: ['DOCENTE'],
        description: 'Grupos activos — accede a la bitácora desde aquí',
      },
      {
        href: '/dashboard/docente/horario',
        icon: CalendarDays,
        label: 'Mi Horario',
        roles: ['DOCENTE'],
        description: 'Vista semanal de clases programadas',
      },
      {
        href: '/dashboard/docente/reportes',
        icon: TrendingUp,
        label: 'Mis Reportes',
        roles: ['DOCENTE'],
        description: 'Solicitar reportes y ver el historial de generados',
      },
    ],
  },

  // ─────────────────────────────────────────
  // ÁREA ESTUDIANTIL
  // ─────────────────────────────────────────
  {
    title: 'Área Estudiantil',
    roles: ['ESTUDIANTE'],
    icon: GraduationCap,
    links: [
      {
        href: '/dashboard/estudiante/asignaturas',
        icon: BookMarked,
        label: 'Mis Asignaturas',
        roles: ['ESTUDIANTE'],
        description: 'Materias en las que estás matriculado',
      },
      {
        href: '/dashboard/estudiante/mi-grupo',
        icon: Users,
        label: 'Mi Grupo',
        roles: ['ESTUDIANTE'],
        description: 'Compañeros y docente de tus grupos',
      },
      {
        href: '/dashboard/estudiante/horario',
        icon: CalendarDays,
        label: 'Mi Horario',
        roles: ['ESTUDIANTE'],
        description: 'Vista semanal de tus clases',
      },
      {
        href: '/dashboard/estudiante/asistencia',
        icon: QrCode,
        label: 'Registrar Asistencia',
        roles: ['ESTUDIANTE'],
        description: 'Registra con QR o código manual',
      },
      {
        href: '/dashboard/estudiante/historial',
        icon: History,
        label: 'Mi Historial',
        roles: ['ESTUDIANTE'],
        description: 'Consulta el registro de tus asistencias',
      },
    ],
  },
];
