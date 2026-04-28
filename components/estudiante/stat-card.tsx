import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'blue' | 'green' | 'amber' | 'default';
}

const colorMap = {
  default: {
    card: 'bg-card/80 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-primary/20 transition-all duration-200',
    icon: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    title: 'text-violet-600 dark:text-violet-400',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground',
    bgAccent: 'bg-violet-50/50 dark:bg-violet-500/5',
  },
  blue: {
    card: 'bg-blue-50/50 dark:bg-blue-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-blue-200/30 transition-all duration-200',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    title: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-400',
    subtitle: 'text-blue-600/70 dark:text-blue-400/70',
    bgAccent: 'bg-blue-50/50 dark:bg-blue-500/5',
  },
  green: {
    card: 'bg-emerald-50/50 dark:bg-emerald-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-emerald-200/30 transition-all duration-200',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    title: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-400',
    subtitle: 'text-emerald-600/70 dark:text-emerald-400/70',
    bgAccent: 'bg-emerald-50/50 dark:bg-emerald-500/5',
  },
  amber: {
    card: 'bg-amber-50/50 dark:bg-amber-500/5 backdrop-blur-sm border-border/20 hover:shadow-md hover:border-amber-200/30 transition-all duration-200',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    title: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-400',
    subtitle: 'text-amber-600/70 dark:text-amber-400/70',
    bgAccent: 'bg-amber-50/50 dark:bg-amber-500/5',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default' }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={`shadow-sm border ${colors.card} rounded-2xl`}>
      <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle
          className={`text-[11px] font-semibold ${colors.title} flex items-center gap-2 tracking-wider uppercase`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-baseline gap-2 mt-2">
          <div className={`text-4xl font-bold tracking-tight ${colors.value}`}>{value}</div>
          {subtitle && <p className={`text-xs font-medium ${colors.subtitle}`}>{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
