import { useMemo } from "react";
import { Clock, CheckCircle2, BarChart2, LayoutDashboard } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { useTickets } from "@/hooks/use-tickets";
import { format, subDays } from "date-fns";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_BY_PRIORITY: Record<string, number> = {
  critical: 18,
  high: 15,
  medium: 10,
  low: 6,
};

const RESOLUTION_DATA = [
  { priority: "Critical", minutes: 18 },
  { priority: "High",     minutes: 15 },
  { priority: "Medium",   minutes: 10 },
  { priority: "Low",      minutes: 6  },
];

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High:     "#f97316",
  Medium:   "#eab308",
  Low:      "#22c55e",
};

// ─── Chart configs ────────────────────────────────────────────────────────────

const incidentsConfig: ChartConfig = {
  incidents: { label: "Incidents", color: "#3b82f6" },
};

const categoryConfig: ChartConfig = {
  count: { label: "Tickets", color: "#3b82f6" },
};

const resolutionConfig: ChartConfig = {
  minutes: { label: "Minutes", color: "#3b82f6" },
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const CARD = "bg-card/50 border border-border/30 rounded-xl p-6";
const TICK_PROPS = { fill: "hsl(var(--muted-foreground))", fontSize: 11 } as const;
const GRID_PROPS = {
  stroke: "rgba(255,255,255,0.05)",
  strokeDasharray: "3 3",
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { data: tickets = [], isLoading } = useTickets();

  const { incidentData, categoryData, totalTickets, resolvedRate, avgTimeSaved, topCategory } =
    useMemo(() => {
      // Incidents over time — last 30 days
      const today = new Date();
      const incidentData = Array.from({ length: 30 }, (_, i) => {
        const day = subDays(today, 29 - i);
        const dayKey = format(day, "yyyy-MM-dd");
        const count = tickets.filter((t) => {
          if (!t.createdAt) return false;
          return format(new Date(t.createdAt as unknown as string), "yyyy-MM-dd") === dayKey;
        }).length;
        return { date: format(day, "MMM d"), incidents: count };
      });

      // Tickets by category
      const catMap: Record<string, number> = {};
      for (const t of tickets) {
        if (t.category) catMap[t.category] = (catMap[t.category] ?? 0) + 1;
      }
      const categoryData = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([category, count]) => ({ category, count }));

      // KPI values
      const totalTickets = tickets.length;

      const resolved = tickets.filter(
        (t) => t.status === "resolved" || t.status === "closed"
      ).length;
      const resolvedRate =
        totalTickets > 0 ? Math.round((resolved / totalTickets) * 100) : 0;

      const analyzed = tickets.filter((t) => t.priority);
      const totalSaved = analyzed.reduce(
        (sum, t) => sum + (TIME_BY_PRIORITY[t.priority!.toLowerCase()] ?? 0),
        0
      );
      const avgTimeSaved =
        analyzed.length > 0 ? (totalSaved / analyzed.length).toFixed(1) : null;

      const topCategory = categoryData.length > 0 ? categoryData[0].category : null;

      return { incidentData, categoryData, totalTickets, resolvedRate, avgTimeSaved, topCategory };
    }, [tickets]);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">

        {/* Page title */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Last 30 days</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/50 border border-border/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Tickets</span>
              <LayoutDashboard className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <p className="text-3xl font-bold">{isLoading ? "—" : totalTickets}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">all time</p>
          </div>

          <div className="bg-card/50 border border-border/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Resolved Rate</span>
              <CheckCircle2 className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <p className="text-3xl font-bold text-green-400">
              {isLoading ? "—" : `${resolvedRate}%`}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">of all tickets</p>
          </div>

          <div className="bg-card/50 border border-border/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Time Saved</span>
              <Clock className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <p className="text-3xl font-bold text-primary">
              {isLoading ? "—" : avgTimeSaved ? `${avgTimeSaved} min` : "—"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">per analyzed ticket</p>
          </div>

          <div className="bg-card/50 border border-border/30 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Top Category</span>
              <BarChart2 className="w-4 h-4 text-muted-foreground/70" />
            </div>
            <p className="text-2xl font-bold truncate">
              {isLoading ? "—" : topCategory ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">most common</p>
          </div>
        </div>

        {/* Chart 1 — Incidents Over Time (full width) */}
        <div className={CARD}>
          <h2 className="text-base font-semibold mb-0.5">Incidents Over Time</h2>
          <p className="text-xs text-muted-foreground mb-4">Daily incidents over the past 30 days</p>
          <ChartContainer config={incidentsConfig} className="h-[240px]">
            <AreaChart data={incidentData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="date" stroke="transparent" tick={TICK_PROPS} interval={4} />
              <YAxis stroke="transparent" tick={TICK_PROPS} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Charts 2 & 3 — side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Chart 2 — Tickets by Category */}
          <div className={CARD}>
            <h2 className="text-base font-semibold mb-4">Tickets by Category</h2>
            {categoryData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground/70">
                No categorized tickets yet
              </div>
            ) : (
              <ChartContainer config={categoryConfig} className="h-[220px]">
                <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid {...GRID_PROPS} />
                  <XAxis dataKey="category" stroke="transparent" tick={TICK_PROPS} />
                  <YAxis stroke="transparent" tick={TICK_PROPS} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          {/* Chart 3 — Time Saved by Priority */}
          <div className={CARD}>
            <h2 className="text-base font-semibold mb-0.5">Time Saved by Priority</h2>
            <p className="text-xs text-muted-foreground mb-4">Minutes saved per ticket, by priority level</p>
            <ChartContainer config={resolutionConfig} className="h-[220px]">
              <BarChart data={RESOLUTION_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis dataKey="priority" stroke="transparent" tick={TICK_PROPS} />
                <YAxis stroke="transparent" tick={TICK_PROPS} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                  {RESOLUTION_DATA.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

        </div>

        </div>
      </main>
    </div>
  );
}
