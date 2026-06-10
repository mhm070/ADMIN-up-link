import { useState } from "react";
import { useListPools, useCreatePool, getListPoolsQueryKey, useDeletePool } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Pools() {
  const { data: pools, isLoading } = useListPools();
  const createPool = useCreatePool();
  const deletePool = useDeletePool();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPool, setNewPool] = useState({ name: "", description: "", color: "#3b82f6" });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPool.mutate({ data: newPool }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewPool({ name: "", description: "", color: "#3b82f6" });
        queryClient.invalidateQueries({ queryKey: getListPoolsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pool?")) {
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
          <p className="text-muted-foreground mt-1">Manage your link collections.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Pool</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Pool</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={newPool.name} onChange={e => setNewPool({...newPool, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={newPool.description} onChange={e => setNewPool({...newPool, description: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color Theme</Label>
                <Input type="color" id="color" className="h-10 p-1 w-full" value={newPool.color} onChange={e => setNewPool({...newPool, color: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createPool.isPending}>
                {createPool.isPending ? "Creating..." : "Create Pool"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : pools?.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-dashed">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No pools yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Create your first pool to organize links.</p>
          <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create Pool</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools?.map((pool) => (
            <Card key={pool.id} className="relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: pool.color || 'var(--color-primary)' }} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      <Link href={`/pools/${pool.id}`} className="hover:underline text-lg">
                        {pool.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-1 mt-1">{pool.description || "No description"}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div><strong className="text-foreground">{pool.linkCount || 0}</strong> links</div>
                  <div><strong className="text-foreground">{pool.totalClicks || 0}</strong> clicks</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="w-full flex-1" asChild>
                    <Link href={`/pools/${pool.id}`}>View Links</Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(pool.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
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
