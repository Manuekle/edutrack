import { DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

export type TutorialSteps = DriveStep[];

export const adminTutorials: Record<string, TutorialSteps> = {
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
  ]
};
