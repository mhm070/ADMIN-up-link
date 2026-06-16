import { useGetStatsOverview, useGetPoolBreakdown, useGetTopLinks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, MousePointerClick, Layers, Link as LinkIcon, Terminal } from "lucide-react";

function formatTs(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

function TerminalLog({ recentLinks }: { recentLinks: { id: number; title: string; url: string; poolName?: string | null; clicks?: number; createdAt: string }[] }) {
  const entries = [
    { ts: "00:00:00", type: "info", text: "admin-link-pool daemon started" },
    { ts: "00:00:01", type: "ok", text: "connected to postgres @ localhost:5432" },
    { ts: "00:00:01", type: "ok", text: "api server listening on :8080" },
    ...recentLinks.map((link) => ({
      ts: formatTs(link.createdAt),
      type: "ok" as const,
      url: link.url,
      text: `REGISTERED  ${link.title}`,
      meta: link.poolName ? `pool=${link.poolName}` : "pool=unassigned",
      clicks: link.clicks,
    })),
    { ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }), type: "info", text: "all systems nominal — awaiting commands_" },
  ];

  return (
    <div className="terminal-box h-full min-h-[260px] p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#0d2e0d]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[#166534] text-[11px] tracking-widest">admin-link-pool — bash</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {entries.map((entry, i) => (
          <div key={i} className="terminal-entry" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="ts">[{entry.ts}] </span>
            {entry.type === "ok" && <span className="label-ok">OK  </span>}
            {entry.type === "info" && <span className="label-info">INFO </span>}
            {entry.type === "warn" && <span className="label-warn">WARN </span>}
            {"url" in entry && entry.url ? (
              <>
                <span className="label-info">{entry.text} </span>
                <span className="label-url">&lt;{entry.url}&gt;</span>
                {entry.meta && <span className="dim"> [{entry.meta}]</span>}
                {entry.clicks !== undefined && <span className="dim"> clicks={entry.clicks}</span>}
              </>
            ) : (
              <span className="label-info">{entry.text}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4"];

export default function Dashboard() {
  const { data: stats } = useGetStatsOverview();
  const { data: topLinks } = useGetTopLinks({ limit: 5 });
  const { data: breakdown } = useGetPoolBreakdown();

  const statCards = [
    { title: "Total Links", value: stats?.totalLinks ?? 0, icon: LinkIcon },
    { title: "Total Pools", value: stats?.totalPools ?? 0, icon: Layers },
    { title: "Total Clicks", value: (stats?.totalClicks ?? 0).toLocaleString(), icon: MousePointerClick },
    { title: "Active Links", value: stats?.activeLinks ?? 0, icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2 text-sm">Overview of your link pools and activity.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="glass-card stat-card" data-testid={`card-stat-${i}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono neon-text">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pool Breakdown */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pool Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            {breakdown && breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown} barCategoryGap="35%">
                  <XAxis
                    dataKey="poolName"
                    stroke="#1f4d2f"
                    tick={{ fill: "#4d7a5a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#1f4d2f"
                    tick={{ fill: "#4d7a5a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(160 84% 45% / 0.06)" }}
                    contentStyle={{
                      background: "hsl(222 44% 9%)",
                      border: "1px solid hsl(160 84% 45% / 0.25)",
                      borderRadius: "8px",
                      color: "#e2f8ee",
                      fontFamily: "JetBrains Mono",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="linkCount" radius={[4, 4, 0, 0]}>
                    {breakdown.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No pool data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Links */}
        <Card className="glass-card flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Links by Clicks</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {topLinks && topLinks.length > 0 ? (
              <div className="space-y-3">
                {topLinks.map((link, i) => (
                  <div key={link.id} className="flex items-center justify-between group" data-testid={`top-link-${link.id}`}>
                    <div className="flex items-center gap-2.5 min-w-0 pr-3">
                      <span className="text-xs font-mono text-muted-foreground/50 w-4 shrink-0">{i + 1}</span>
                      <div className="min-w-0">
                        <Link href={`/links/${link.id}`} className="font-medium text-sm hover:text-primary transition-colors truncate block">
                          {link.title}
                        </Link>
                        <span className="text-[11px] text-muted-foreground/60 truncate block font-mono">{link.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-xs font-mono font-semibold text-primary">
                      <MousePointerClick className="w-3 h-3" />
                      {link.clicks}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No clicks recorded yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Terminal activity log */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Activity Log</h2>
          <span className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>
        <TerminalLog recentLinks={stats?.recentLinks ?? []} />
      </div>
    </div>
  );
}
