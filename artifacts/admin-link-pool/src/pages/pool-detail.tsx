import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  useGetPool,
  useUpdatePool,
  useDeletePool,
  useListPoolLinks,
  getGetPoolQueryKey,
  getListPoolLinksQueryKey,
  useCreateLink,
  useDeleteLink,
  useRecordLinkClick
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2, ExternalLink, ArrowLeft, MoreVertical, Link as LinkIcon, Layers, MousePointerClick, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PoolDetail() {
  const params = useParams();
  const poolId = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: pool, isLoading: isPoolLoading } = useGetPool(poolId, {
    query: { enabled: !!poolId, queryKey: getGetPoolQueryKey(poolId) }
  });

  const { data: links, isLoading: isLinksLoading } = useListPoolLinks(poolId, {
    query: { enabled: !!poolId, queryKey: getListPoolLinksQueryKey(poolId) }
  });

  const updatePool = useUpdatePool();
  const deletePool = useDeletePool();
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const recordClick = useRecordLinkClick();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

  const [editData, setEditData] = useState({ name: "", description: "", color: "" });
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", isActive: true, poolId: poolId });

  useEffect(() => {
    if (pool) {
      setEditData({ name: pool.name, description: pool.description || "", color: pool.color || "#22c55e" });
      setNewLink(prev => ({ ...prev, poolId: pool.id }));
    }
  }, [pool]);

  const handleUpdatePool = (e: React.FormEvent) => {
    e.preventDefault();
    updatePool.mutate({ id: poolId, data: editData }, {
      onSuccess: () => {
        setIsEditOpen(false);
        queryClient.invalidateQueries({ queryKey: getGetPoolQueryKey(poolId) });
      }
    });
  };

  const handleDeletePool = () => {
    if (confirm("Delete this pool and all its links?")) {
      deletePool.mutate({ id: poolId }, { onSuccess: () => setLocation("/pools") });
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate({ data: newLink }, {
      onSuccess: () => {
        setIsAddLinkOpen(false);
        setNewLink({ title: "", url: "", description: "", isActive: true, poolId });
        queryClient.invalidateQueries({ queryKey: getListPoolLinksQueryKey(poolId) });
      }
    });
  };

  const handleDeleteLink = (id: number) => {
    if (confirm("Delete this link?")) {
      deleteLink.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListPoolLinksQueryKey(poolId) })
      });
    }
  };

  const handleClick = (id: number, url: string) => {
    recordClick.mutate({ id });
    window.open(url, "_blank");
  };

  if (isPoolLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground font-mono text-sm animate-pulse">
      loading pool...
    </div>
  );
  if (!pool) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      Pool not found.
    </div>
  );

  const accentColor = pool.color || "#22c55e";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <Link href="/pools" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium" data-testid="link-back-pools">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Pools
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: accentColor, boxShadow: `0 0 20px ${accentColor}50` }}
            data-testid="pool-icon"
          >
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="pool-name">{pool.name}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{pool.description || "No description provided."}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-border/50 hover:border-primary/30" data-testid="button-edit-pool">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-[hsl(160_84%_45%/0.15)]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Edit Pool
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdatePool} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="input-edit-pool-name" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="input-edit-pool-description" />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-3 items-center">
                    <Input type="color" className="h-10 w-14 p-1 border-border/60" value={editData.color} onChange={e => setEditData({ ...editData, color: e.target.value })} data-testid="input-edit-pool-color" />
                    <span className="text-xs font-mono text-muted-foreground">{editData.color}</span>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-glow bg-primary text-primary-foreground font-semibold" disabled={updatePool.isPending} data-testid="button-edit-pool-submit">
                  {updatePool.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 border-border/30" data-testid="button-pool-more">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-card border-border/40">
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer" onClick={handleDeletePool} data-testid="button-delete-pool">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Pool
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats bar */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-6">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Links</div>
          <div className="text-2xl font-bold font-mono neon-text mt-0.5" data-testid="pool-link-count">{pool.linkCount || 0}</div>
        </div>
        <div className="w-px h-10 bg-border/50" />
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Clicks</div>
          <div className="text-2xl font-bold font-mono neon-text mt-0.5" data-testid="pool-click-count">{pool.totalClicks || 0}</div>
        </div>
      </div>

      {/* Links section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Links in Pool</h2>
          <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="btn-glow bg-primary text-primary-foreground font-semibold text-xs" data-testid="button-add-link">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Link
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-[hsl(160_84%_45%/0.15)]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Add Link to {pool.name}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLink} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input required value={newLink.title} onChange={e => setNewLink({ ...newLink, title: e.target.value })} className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="input-add-link-title" />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input type="url" required value={newLink.url} onChange={e => setNewLink({ ...newLink, url: e.target.value })} placeholder="https://..." className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="input-add-link-url" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={newLink.description} onChange={e => setNewLink({ ...newLink, description: e.target.value })} className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="input-add-link-description" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="add-link-active" checked={newLink.isActive} onCheckedChange={(c) => setNewLink({ ...newLink, isActive: c })} data-testid="switch-add-link-active" />
                  <Label htmlFor="add-link-active" className="cursor-pointer text-sm">Active</Label>
                </div>
                <Button type="submit" className="w-full btn-glow bg-primary text-primary-foreground font-semibold" disabled={createLink.isPending} data-testid="button-add-link-submit">
                  {createLink.isPending ? "Adding..." : "Add Link"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="glass-card rounded-xl overflow-hidden border border-border/40">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Title</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">URL</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Clicks</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLinksLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground font-mono text-sm animate-pulse">loading links...</TableCell>
                </TableRow>
              ) : links?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <LinkIcon className="w-5 h-5 text-primary/40" />
                      </div>
                      <p className="text-sm text-muted-foreground">No links in this pool yet.</p>
                      <Button variant="link" onClick={() => setIsAddLinkOpen(true)} className="text-primary text-xs mt-0" data-testid="button-add-first-link">
                        Add your first link
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                links?.map((link) => (
                  <TableRow key={link.id} className="border-border/30 hover:bg-primary/5 transition-colors" data-testid={`row-pool-link-${link.id}`}>
                    <TableCell>
                      <Link href={`/links/${link.id}`} className="font-medium text-sm hover:text-primary transition-colors">
                        {link.title}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <button
                        onClick={() => handleClick(link.id, link.url)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group text-xs font-mono"
                        data-testid={`button-open-pool-link-${link.id}`}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{link.url}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      {link.isActive ? (
                        <Badge className="bg-primary/10 text-primary border border-primary/20 shadow-none text-xs" data-testid={`badge-pool-link-active-${link.id}`}>Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="shadow-none text-xs opacity-60" data-testid={`badge-pool-link-inactive-${link.id}`}>Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 font-mono text-xs text-primary font-semibold">
                        <MousePointerClick className="w-3 h-3 opacity-50" />
                        {link.clicks}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLink(link.id)}
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`button-delete-pool-link-${link.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
