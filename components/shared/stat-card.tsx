import { Card, CardContent } from '@/components/ui/card';

export type StatCardColor = 'default' | 'blue' | 'green' | 'amber' | 'warm';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: StatCardColor;
  children?: React.ReactNode;
}

const colorMap: Record<StatCardColor, { icon: string }> = {
  default: { icon: 'bg-muted text-muted-foreground' },
  blue: { icon: 'bg-primary/10 text-primary' },
  green: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  warm: { icon: 'bg-warm/15 text-amber-700 dark:text-warm' },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'default',
  children,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="rounded-2xl shadow-xs hover:shadow-sm transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div
            className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {children ?? (
          <div className="flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
            {subtitle && <p className="text-xs font-medium text-muted-foreground">{subtitle}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
