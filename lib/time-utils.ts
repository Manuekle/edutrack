/**
 * Utility functions for time calculations
 */

/**
 * Calculates duration in hours between two time strings
 * @param start - Time string in format "HH:MM"
 * @param end - Time string in format "HH:MM"
 * @returns Duration in hours
 */
export function calculateDuration(start: string, end: string): number {
  const [sh, sm] = (start || "").trim().split(":")
  const [eh, em] = (end || "").trim().split(":")

  const startHour = Number(sh)
  const startMin = Number(sm ?? 0)
  const endHour = Number(eh)
  const endMin = Number(em ?? 0)

  const sH = Number.isNaN(startHour) ? 0 : startHour
  const sM = Number.isNaN(startMin) ? 0 : startMin
  const eH = Number.isNaN(endHour) ? 0 : endHour
  const eM = Number.isNaN(endMin) ? 0 : endMin

  const startMinutes = sH * 60 + sM
  const endMinutes = eH * 60 + eM
  const diff = Math.max(0, endMinutes - startMinutes)

  return diff / 60
}

/**
 * Formats duration in hours to a human-readable string
 * @param duration - Duration in hours
 * @returns Formatted string like "2 horas" or "2 horas y 30 minutos"
 */
export function formatDuration(duration: number): string {
  const hours = Math.floor(duration)
  const minutes = Math.round((duration - hours) * 60)

  if (minutes > 0) {
    return `${hours} ${hours === 1 ? "hora" : "horas"} y ${minutes} minutos`
  }
  return `${hours} ${hours === 1 ? "hora" : "horas"}`
}

/**
 * Adjusts end time to ensure minimum duration
 * @param startTime - Start time string "HH:MM"
 * @param endTime - End time string "HH:MM"
 * @param minDurationHours - Minimum duration in hours
 * @returns Adjusted end time string
 */
export function adjustEndTime(startTime: string, endTime: string, minDurationHours = 2): string {
  const [sh, sm = "00"] = startTime.split(":")
  const [eh, em = "00"] = endTime.split(":")

  const startHour = Number.parseInt(sh, 10)
  const startMin = Number.parseInt(sm, 10)
  const endHour = Number.parseInt(eh, 10)
  const endMin = Number.parseInt(em, 10)

  const startTotalMin = startHour * 60 + startMin
  const endTotalMin = endHour * 60 + endMin

  if (endTotalMin - startTotalMin < minDurationHours * 60) {
    const adjustedTotalMin = Math.min(startTotalMin + minDurationHours * 60, 22 * 60)
    const adjustedHour = Math.floor(adjustedTotalMin / 60)
    const adjustedMin = adjustedTotalMin % 60
    return `${adjustedHour.toString().padStart(2, "0")}:${adjustedMin.toString().padStart(2, "0")}`
  }

  return endTime
}

/**
 * Gets today's date with time set to 00:00:00
 * @returns Date object representing today at midnight
 */
export function getTodayWithoutTime(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Creates a local Date object from a date string
 * @param dateString - Date string in ISO format (YYYY-MM-DD)
 * @returns Date object in local timezone
 */
export function createLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Checks if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Formats a date for display
 * @param date - Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export function formatDisplayDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Formats a date for API submission
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatForAPI(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Formats a Date object to time string
 * @param time - Date object
 * @returns Time string in HH:MM format
 */
export function formatDisplayTime(time: Date): string {
  const hours = time.getHours().toString().padStart(2, "0")
  const minutes = time.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}
