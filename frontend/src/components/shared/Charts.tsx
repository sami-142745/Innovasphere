import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';

export interface SliceDatum {
  label: string;
  value: number;
}

export interface SeriesDatum {
  label: string;
  value: number;
}

export const PALETTE = ['#6D5EF5', '#3B82F6', '#00D1FF', '#A855F7', '#22C55E', '#F59E0B', '#F43F5E', '#14B8A6'];

const AXIS_TICK = { fontSize: 12, fill: 'currentColor' };

function ChartCardShell({
  title,
  description,
  className,
  children
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl border border-slate-200/80 px-3 py-2 text-xs shadow-card dark:border-white/10">
      <p className="mb-1 font-semibold text-slate-900 dark:text-slate-100">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} aria-hidden="true" />
          <span className="font-medium">{Number(entry.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

export function DonutChartCard({
  title,
  description,
  data,
  className
}: {
  title: string;
  description?: string;
  data: SliceDatum[];
  className?: string;
}) {
  return (
    <ChartCardShell title={title} description={description} className={className}>
      {data.length === 0 ? (
        <EmptyState title="No data yet" description="Nothing to display for this chart." />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.map((d) => ({ name: d.label, value: d.value }))}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={3}
                strokeWidth={2}
                stroke="transparent"
              >
                {data.map((d, i) => (
                  <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            {data.map((d, i) => (
              <span key={d.label} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} aria-hidden="true" />
                {d.label} · {d.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </ChartCardShell>
  );
}

export function BarChartCard({
  title,
  description,
  data,
  color = '#6D5EF5',
  className
}: {
  title: string;
  description?: string;
  data: SeriesDatum[];
  color?: string;
  className?: string;
}) {
  return (
    <ChartCardShell title={title} description={description} className={className}>
      {data.length === 0 ? (
        <EmptyState title="No data yet" description="Nothing to display for this chart." />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.map((d) => ({ name: d.label, value: d.value }))} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200/70 dark:text-white/10" vertical={false} />
              <XAxis dataKey="name" tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} />
              <YAxis tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(109, 94, 245, 0.08)' }} />
              <Bar dataKey="value" fill={color} radius={[8, 8, 2, 2]} maxBarSize={44} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  );
}

export function TrendChartCard({
  title,
  description,
  data,
  color = '#6D5EF5',
  className,
  fill
}: {
  title: string;
  description?: string;
  data: SeriesDatum[];
  color?: string;
  className?: string;
  fill?: boolean;
}) {
  const gradientId = useId().replace(/:/g, '');
  const chartData = data.map((d) => ({ name: d.label, value: d.value }));
  return (
    <ChartCardShell title={title} description={description} className={className}>
      {chartData.length === 0 ? (
        <EmptyState title="No data yet" description="Nothing to display for this chart." />
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {fill ? (
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id={`trend-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200/70 dark:text-white/10" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#trend-${gradientId})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200/70 dark:text-white/10" vertical={false} />
                <XAxis dataKey="name" tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} className="text-slate-500 dark:text-slate-400" axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </ChartCardShell>
  );
}