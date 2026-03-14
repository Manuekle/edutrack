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
    card: 'bg-muted/30 dark:bg-white/[0.02]',
    icon: 'bg-blue-500/10 text-blue-500',
    title: 'text-muted-foreground',
    value: 'text-foreground',
    subtitle: 'text-muted-foreground',
  },
  blue: {
    card: 'bg-blue-500/5 dark:bg-blue-500/10',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
    title: 'text-blue-700/70 dark:text-blue-400/70',
    value: 'text-blue-700 dark:text-blue-400',
    subtitle: 'text-blue-600/70 dark:text-blue-400/70',
  },
  green: {
    card: 'bg-green-500/5 dark:bg-green-500/10',
    icon: 'bg-green-500/10 text-green-600 dark:text-green-500',
    title: 'text-green-700/70 dark:text-green-400/70',
    value: 'text-green-700 dark:text-green-400',
    subtitle: 'text-green-600/70 dark:text-green-400/70',
  },
  amber: {
    card: 'bg-amber-500/5 dark:bg-amber-500/10',
    icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-500',
    title: 'text-amber-700/70 dark:text-amber-400/70',
    value: 'text-amber-700 dark:text-amber-400',
    subtitle: 'text-amber-600/70 dark:text-amber-400/70',
  },
};

export function StatCard({ title, value, subtitle, icon: Icon, color = 'default' }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card className={`shadow-none border-0 ${colors.card} rounded-2xl`}>
      <CardHeader className="pb-1 pt-5 px-5 flex flex-row items-center justify-between space-y-0">
        <CardTitle
          className={`text-[13px] font-medium ${colors.title} flex items-center gap-2 tracking-card uppercase`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${colors.icon}`}>
            <Icon className="h-4 w-4" />
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="flex items-baseline gap-2 mt-2">
          <div className={`text-4xl font-semibold tracking-card ${colors.value}`}>{value}</div>
          {subtitle && <p className={`text-xs font-medium ${colors.subtitle}`}>{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
