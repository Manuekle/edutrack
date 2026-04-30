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
    card: 'bg-card/80 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-primary/20',
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground',
  },
  blue: {
    card: 'bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-blue-200/30',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-400',
    subtitle: 'text-blue-600/70 dark:text-blue-400/70',
  },
  green: {
    card: 'bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-emerald-200/30',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-400',
    subtitle: 'text-emerald-600/70 dark:text-emerald-400/70',
  },
  amber: {
    card: 'bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-amber-200/30',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
    subtitle: 'text-amber-600/70 dark:text-amber-400/70',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default', children }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={`shadow-sm border transition-all duration-200 ${colors.card} rounded-2xl`}>
      <CardContent className="pt-5 pb-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${colors.icon}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
        {children ?? (
          <div className="flex items-baseline gap-2">
            <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${colors.value}`}>
              {value}
            </p>
            {subtitle && (
              <p className={`text-xs font-medium ${colors.subtitle}`}>{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
