import { useGetStatsOverview, useGetPoolBreakdown, useGetTopLinks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, MousePointerClick, Layers, Link as LinkIcon } from "lucide-react";

export default function Dashboard() {
  const { data: stats } = useGetStatsOverview();
  const { data: topLinks } = useGetTopLinks({ limit: 5 });
  const { data: breakdown } = useGetPoolBreakdown();

  const statCards = [
    { title: "Total Links", value: stats?.totalLinks ?? 0, icon: LinkIcon },
    { title: "Total Pools", value: stats?.totalPools ?? 0, icon: Layers },
    { title: "Total Clicks", value: stats?.totalClicks ?? 0, icon: MousePointerClick },
    { title: "Active Links", value: stats?.activeLinks ?? 0, icon: Activity },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your link pools and activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Pool Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {breakdown && breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown}>
                  <XAxis dataKey="poolName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="linkCount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No pool data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>Top Links</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {topLinks && topLinks.length > 0 ? (
              <div className="space-y-4">
                {topLinks.map((link) => (
                  <div key={link.id} className="flex items-center justify-between">
                    <div className="flex flex-col min-w-0 pr-4">
                      <Link href={`/links/${link.id}`} className="font-medium text-sm hover:underline truncate">
                        {link.title}
                      </Link>
                      <span className="text-xs text-muted-foreground truncate">{link.url}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 bg-secondary px-2.5 py-1 rounded-md text-xs font-medium">
                      <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                      <span>{link.clicks}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No top links yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
