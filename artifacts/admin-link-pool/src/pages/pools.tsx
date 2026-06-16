import { useState } from "react";
import { useListPools, useCreatePool, getListPoolsQueryKey, useDeletePool } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Layers, MousePointerClick, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";

export default function Pools() {
  const { data: pools, isLoading } = useListPools();
  const createPool = useCreatePool();
  const deletePool = useDeletePool();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPool, setNewPool] = useState({ name: "", description: "", color: "#22c55e" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPool.mutate({ data: newPool }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPool({ name: "", description: "", color: "#22c55e" });
        queryClient.invalidateQueries({ queryKey: getListPoolsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this pool?")) {
      deletePool.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPoolsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pools</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your link collections.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-glow bg-primary text-primary-foreground font-semibold" data-testid="button-create-pool">
              <Plus className="w-4 h-4 mr-2" /> New Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-[hsl(160_84%_45%/0.15)] shadow-[0_0_40px_hsl(222_47%_4%/0.8)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Create Pool
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pool-name">Name</Label>
                <Input
                  id="pool-name"
                  required
                  value={newPool.name}
                  onChange={e => setNewPool({ ...newPool, name: e.target.value })}
                  className="bg-[hsl(222_47%_8%)] border-border/60"
                  placeholder="e.g. Development"
                  data-testid="input-pool-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool-desc">Description</Label>
                <Input
                  id="pool-desc"
                  value={newPool.description}
                  onChange={e => setNewPool({ ...newPool, description: e.target.value })}
                  className="bg-[hsl(222_47%_8%)] border-border/60"
                  placeholder="Optional description"
                  data-testid="input-pool-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pool-color">Accent Color</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    id="pool-color"
                    className="h-10 w-14 p-1 rounded-md cursor-pointer border-border/60"
                    value={newPool.color}
                    onChange={e => setNewPool({ ...newPool, color: e.target.value })}
                    data-testid="input-pool-color"
                  />
                  <span className="text-xs font-mono text-muted-foreground">{newPool.color}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full btn-glow bg-primary text-primary-foreground font-semibold"
                disabled={createPool.isPending}
                data-testid="button-create-pool-submit"
              >
                {createPool.isPending ? "Creating..." : "Create Pool"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : pools?.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-xl border border-dashed border-primary/20">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7 text-primary/60" />
          </div>
          <h3 className="text-lg font-semibold">No pools yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-5">Create your first pool to organize your links.</p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="btn-glow bg-primary text-primary-foreground"
            data-testid="button-create-first-pool"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Pool
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools?.map((pool) => (
            <Card
              key={pool.id}
              className="glass-card stat-card relative overflow-hidden group"
              data-testid={`card-pool-${pool.id}`}
            >
              {/* Color accent bar */}
              <div
                className="absolute top-0 left-0 w-full h-[2px]"
                style={{ background: `linear-gradient(90deg, ${pool.color || '#22c55e'}, transparent)` }}
              />
              {/* Side bar */}
              <div
                className="absolute top-0 left-0 w-[3px] h-full rounded-l-xl"
                style={{ backgroundColor: pool.color || '#22c55e', opacity: 0.8 }}
              />

              <CardHeader className="pb-2 pl-6">
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      <Link href={`/pools/${pool.id}`} className="hover:text-primary transition-colors truncate block">
                        {pool.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-1 mt-0.5 text-xs">
                      {pool.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pl-6">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold font-mono text-foreground">{pool.linkCount || 0}</span>
                    <span className="text-xs">links</span>
                  </div>
                  <div className="w-px h-4 bg-border/60" />
                  <div className="flex items-center gap-1.5">
                    <MousePointerClick className="w-3 h-3 text-primary/60" />
                    <span className="font-bold font-mono text-foreground">{pool.totalClicks || 0}</span>
                    <span className="text-xs">clicks</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full flex-1 text-xs group-hover:border-primary/20 transition-colors"
                    asChild
                    data-testid={`button-view-pool-${pool.id}`}
                  >
                    <Link href={`/pools/${pool.id}`}>
                      View Links <ArrowRight className="w-3 h-3 ml-1.5 opacity-50" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(pool.id)}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                    data-testid={`button-delete-pool-${pool.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
