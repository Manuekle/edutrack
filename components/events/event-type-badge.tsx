import { Badge } from '@/components/ui/badge';
import { getEventTypeLabel } from '@/lib/event-utils';
import type { EventType } from '@/types';

interface EventTypeBadgeProps {
  type: EventType;
}

export function EventTypeBadge({ type }: EventTypeBadgeProps) {
  return (
    <Badge variant="outline" className="text-xs font-normal font-sans">
      {getEventTypeLabel(type)}
    </Badge>
  );
}
