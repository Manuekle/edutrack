import { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TutorialSteps = DriveStep[];

export const adminTutorials: Record<string, TutorialSteps> = {
  '/dashboard/admin': [
    {
      element: '#tour-dashboard-title',
      popover: {
        title: 'Panel Principal',
        description: 'Bienvenido al centro de mando de SIRA. Aquí tienes una visión general de la institución.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-dashboard-metrics',
      popover: {
        title: 'Métricas en Tiempo Real',
        description: 'Vigila el total de estudiantes, docentes y salas activas en el sistema de un vistazo.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-dashboard-users-chart',
      popover: {
        title: 'Distribución de Usuarios',
        description: 'Visualiza la proporción de estudiantes y docentes registrados en la plataforma.',
        side: 'right',
      },
    },
    {
      element: '#tour-dashboard-classes-chart',
      popover: {
        title: 'Actividad Académica',
        description: 'Monitorea el número de clases impartidas mes a mes para medir el uso del sistema.',
        side: 'left',
      },
    },
  ],
  '/dashboard/admin/asignaturas': [
    {
      element: '#tour-asignaturas-title',
      popover: {
        title: 'Catálogo de Asignaturas',
        description: 'Gestiona todas las materias ofrecidas por la facultad.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-asignaturas-filters',
      popover: {
        title: 'Búsqueda Avanzada',
        description: 'Encuentra asignaturas rápidamente por nombre o código único.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-asignaturas-actions',
      popover: {
        title: 'Acciones en Bloque',
        description: 'Selecciona una o varias materias para eliminarlas o realizar cambios masivos.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-asignaturas-table',
      popover: {
        title: 'Listado Maestro',
        description: 'Consulta los créditos, horas y estados de cada asignatura registrada.',
        side: 'top',
      },
    },
  ],
  '/dashboard/admin/matricula': [
    {
      element: '#tour-matricula-title',
      popover: {
        title: 'Gestión de Matrículas',
        description: 'En esta sección podrás agregar estudiantes a los diferentes grupos operativos o cohortes.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-mode-toggle',
      popover: {
        title: 'Modos de Carga',
        description: 'Puedes elegir entre subir un archivo CSV para múltiples asignaciones, o hacer una asignación manual uno a uno.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-instructions',
      popover: {
        title: 'Instrucciones y Plantilla',
        description: 'Si eliges carga masiva, descarga nuestra plantilla CSV y asegúrate de llenar las columnas requeridas (documento, grupo y periodo).',
        side: 'right',
      },
    },
    {
      element: '#tour-upload-panel',
      popover: {
        title: 'Panel de Carga',
        description: 'Sube tu archivo CSV o busca manualmente a los estudiantes aquí. Una vez listos, genera la vista previa.',
        side: 'right',
      },
    },
    {
      element: '#tour-preview',
      popover: {
        title: 'Vista Previa de Asignación',
        description: 'Revisa qué estudiantes se vincularán exitosamente, quiénes ya estaban agregados y qué filas tienen errores. Solo los correctos serán procesados al confirmar.',
        side: 'left',
      },
    },
  ],
  '/dashboard/admin/usuarios': [
    {
      element: '#tour-users-title',
      popover: {
        title: 'Gestión de Usuarios',
        description: 'Administra todos los estudiantes, docentes y administradores del sistema SIRA.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-users-filters',
      popover: {
        title: 'Filtros y Búsqueda',
        description: 'Utiliza esta barra para buscar por nombre o documento, y filtra por el rol específico del usuario.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-users-create',
      popover: {
        title: 'Crear Usuario',
        description: 'Si necesitas registrar un usuario manualmente, usa este botón para abrir el formulario de creación.',
        side: 'left',
      },
    },
    {
      element: '#tour-users-table',
      popover: {
        title: 'Tabla de Usuarios',
        description: 'Aquí verás el listado de usuarios. Puedes editar su información básica (excepto correos institucionales) desde el menú de acciones al final de cada fila.',
        side: 'top',
      },
    },
  ],
  '/dashboard/admin/grupos': [
    {
      element: '#tour-grupos-title',
      popover: {
        title: 'Configuración de Grupos',
        description: 'Crea y organiza los grupos y horarios para cada periodo académico.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-grupos-mode',
      popover: {
        title: 'Modos de Entrada',
        description: 'Elige entre cargar un conjunto de horarios vía CSV o configurarlos manualmente uno por uno.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-grupos-config',
      popover: {
        title: 'Ajustes de Periodo',
        description: 'Define el año y semestre al que pertenecerán estos nuevos grupos.',
        side: 'right',
      },
    },
    {
      element: '#tour-grupos-preview',
      popover: {
        title: 'Vista Previa de Horarios',
        description: 'Verifica los cruces y disponibilidad antes de confirmar la creación de los grupos.',
        side: 'top',
      },
    },
  ],
  '/dashboard/admin/salas': [
    {
      element: '#tour-salas-title',
      popover: {
        title: 'Gestión de Espacios',
        description: 'Administra las salas de cómputo y auditorios disponibles para las clases.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-salas-tabs',
      popover: {
        title: 'Categorías de Salas',
        description: 'Navega entre salas activas, inactivas o el listado completo de espacios físicos.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-salas-actions',
      popover: {
        title: 'Crear y Subir',
        description: 'Agrega una nueva sala individualmente o importa múltiples espacios usando un archivo CSV.',
        side: 'left',
      },
    },
  ],
  '/dashboard/admin/microcurriculo': [
    {
      element: '#tour-microcurriculo-title',
      popover: {
        title: 'Estructura Académica',
        description: 'Define el contenido detallado de cada asignatura para el control de temas.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-microcurriculo-mode',
      popover: {
        title: 'Importación de Temas',
        description: 'Carga el microcurrículo completo desde un archivo o escríbelo directamente en el sistema.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-microcurriculo-preview',
      popover: {
        title: 'Estructura Jerárquica',
        description: 'Revisa las unidades y temas resultantes antes de que los docentes comiencen a llamarlos a lista.',
        side: 'top',
      },
    },
  ],
  '/dashboard/admin/reportes': [
    {
      element: '#tour-reportes-title',
      popover: {
        title: 'Análisis Docente',
        description: 'Accede a las estadísticas detalladas de asistencia por docente y asignatura.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-reportes-list',
      popover: {
        title: 'Selección de Docente',
        description: 'Busca y selecciona al docente que deseas auditar en esta lista.',
        side: 'right',
      },
    },
    {
      element: '#tour-reportes-filters',
      popover: {
        title: 'Filtros de Tiempo',
        description: 'Ajusta el periodo académico y la asignatura específica para ver datos precisos.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-reportes-chart',
      popover: {
        title: 'Tendencia de Asistencia',
        description: 'Visualiza la evolución de la asistencia en el tiempo para detectar irregularidades.',
        side: 'top',
      },
    },
  ],
  '/dashboard/admin/estudiantes/cargar': [
    {
      element: '#tour-cargar-estudiantes-title',
      popover: {
        title: 'Ingreso de Estudiantes',
        description: 'Agrega nuevos estudiantes a la base de datos central de SIRA.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-cargar-estudiantes-mode',
      popover: {
        title: 'Flexibilidad de Entrada',
        description: '¿Uno solo o cientos? Elige Carga Masiva para subir un CSV o Crear Manual para registros individuales.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-cargar-estudiantes-instructions',
      popover: {
        title: 'Guía de Datos',
        description: 'Asegúrate de incluir documento, nombre y el correo institucional correcto.',
        side: 'right',
      },
    },
    {
      element: '#tour-cargar-estudiantes-preview',
      popover: {
        title: 'Validación de Datos',
        description: 'SIRA verificará si el estudiante ya existe o si hay errores en el formato antes de crearlo.',
        side: 'left',
      },
    },
  ],
  '/dashboard/admin/docentes/cargar': [
    {
      element: '#tour-cargar-docentes-title',
      popover: {
        title: 'Ingreso de Docentes',
        description: 'Registra a los catedráticos y profesores en el sistema.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '#tour-cargar-docentes-mode',
      popover: {
        title: 'Selección de Método',
        description: 'Usa la carga masiva para el inicio de semestre o el manual para incorporaciones tardías.',
        side: 'bottom',
      },
    },
    {
      element: '#tour-cargar-docentes-preview',
      popover: {
        title: 'Verificación Final',
        description: 'Revisa nombres y correos antes de confirmar el acceso al portal docente.',
        side: 'left',
      },
    },
  ],
};
