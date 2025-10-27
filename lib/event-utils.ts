import type { EventType } from "@/types"

/**
 * Utility functions for event management
 */

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  EXAMEN: "Examen",
  TRABAJO: "Tarea",
  LIMITE: "Fecha límite",
  ANUNCIO: "Anuncio",
  INFO: "Informativo",
}

/**
 * Gets the label for an event type
 */
export function getEventTypeLabel(type: EventType): string {
  return EVENT_TYPE_LABELS[type] || type
}
