import type { ClassStatus } from "@/lib/class-utils"
import type { ClassWithStatus as TableClassWithStatus } from "@/components/classes/classes-table"

export type { ClassWithStatus as TableClassWithStatus } from "@/components/classes/classes-table"

// Local alias that extends the table type with Date support for form handling
export type LocalClassWithStatus = Omit<
  TableClassWithStatus,
  "date" | "startTime" | "endTime" | "topic" | "description" | "status" | "cancellationReason"
> & {
  date: string | Date
  startTime?: string | Date | null
  endTime?: string | Date | null
  topic?: string | null
  description?: string | null
  status: ClassStatus
  cancellationReason?: string | null
  [key: string]: unknown
}
