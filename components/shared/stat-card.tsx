import { Card, CardContent } from '@/components/ui/card';

export type StatCardColor = 'default' | 'blue' | 'green' | 'amber';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: StatCardColor;
  children?: React.ReactNode;
}

const colorMap: Record<
  StatCardColor,
  { card: string; icon: string; value: string; subtitle: string }
> = {
  default: {
    card: 'bg-card border-border hover:shadow-md hover:border-primary/40',
    icon: 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground',
  },
  blue: {
    card: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700/50',
    icon: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    subtitle: 'text-blue-600/80 dark:text-blue-400/80',
  },
  green: {
    card: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700/50',
    icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    subtitle: 'text-emerald-600/80 dark:text-emerald-400/80',
  },
  amber: {
    card: 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700/50',
    icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    subtitle: 'text-amber-600/80 dark:text-amber-400/80',
  },
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
    <Card className={`shadow-sm border transition-all duration-200 ${colors.card} rounded-2xl`}>
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-center justify-between mb-3">
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
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${colors.value}`}>
              {value}
            </p>
            {subtitle && <p className={`text-xs font-medium ${colors.subtitle}`}>{subtitle}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
