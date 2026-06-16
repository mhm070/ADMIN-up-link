import { useState } from "react";
import { useListLinks, useCreateLink, useDeleteLink, getListLinksQueryKey, useRecordLinkClick } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Trash2, ExternalLink, MousePointerClick, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Links() {
  const [search, setSearch] = useState("");
  const { data: links, isLoading } = useListLinks({ search: search || undefined });
  const createLink = useCreateLink();
  const deleteLink = useDeleteLink();
  const recordClick = useRecordLinkClick();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", isActive: true });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate({ data: newLink }, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewLink({ title: "", url: "", description: "", isActive: true });
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this link?")) {
      deleteLink.mutate({ id }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() })
      });
    }
  };

  const handleClick = (id: number, url: string) => {
    recordClick.mutate({ id });
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Links</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage all URLs across your pools.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-glow bg-primary text-primary-foreground font-semibold" data-testid="button-create-link">
              <Plus className="w-4 h-4 mr-2" /> New Link
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-[hsl(160_84%_45%/0.15)] shadow-[0_0_40px_hsl(222_47%_4%/0.8)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Create Link
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="link-title">Title</Label>
                <Input
                  id="link-title"
                  required
                  value={newLink.title}
                  onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                  className="bg-[hsl(222_47%_8%)] border-border/60"
                  placeholder="e.g. Vite Documentation"
                  data-testid="input-link-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  type="url"
                  required
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  className="bg-[hsl(222_47%_8%)] border-border/60"
                  placeholder="https://..."
                  data-testid="input-link-url"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="link-desc">Description</Label>
                <Input
                  id="link-desc"
                  value={newLink.description}
                  onChange={e => setNewLink({ ...newLink, description: e.target.value })}
                  className="bg-[hsl(222_47%_8%)] border-border/60"
                  placeholder="Optional"
                  data-testid="input-link-description"
                />
              </div>
              <div className="flex items-center space-x-2 py-1">
                <Switch
                  id="link-active"
                  checked={newLink.isActive}
                  onCheckedChange={(c) => setNewLink({ ...newLink, isActive: c })}
                  data-testid="switch-link-active"
                />
                <Label htmlFor="link-active" className="text-sm cursor-pointer">Active</Label>
              </div>
              <Button
                type="submit"
                className="w-full btn-glow bg-primary text-primary-foreground font-semibold"
                disabled={createLink.isPending}
                data-testid="button-create-link-submit"
              >
                {createLink.isPending ? "Creating..." : "Create Link"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search links..."
          className="pl-9 bg-[hsl(222_47%_8%)] border-border/60"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-links"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-border/40">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Title</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">URL</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Pool</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 text-right">Clicks</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  <span className="font-mono animate-pulse">loading...</span>
                </TableCell>
              </TableRow>
            ) : links?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  No links found
                </TableCell>
              </TableRow>
            ) : (
              links?.map((link) => (
                <TableRow
                  key={link.id}
                  className="border-border/30 hover:bg-primary/5 transition-colors"
                  data-testid={`row-link-${link.id}`}
                >
                  <TableCell className="font-medium text-sm">{link.title}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <button
                      onClick={() => handleClick(link.id, link.url)}
                      className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group text-xs font-mono"
                      data-testid={`button-open-link-${link.id}`}
                    >
                      <ExternalLink className="w-3 h-3 shrink-0 group-hover:text-primary" />
                      <span className="truncate">{link.url}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    {link.poolName ? (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium"
                        style={{ borderColor: `${link.poolColor || '#22c55e'}60`, color: link.poolColor || '#22c55e' }}
                        data-testid={`badge-pool-${link.id}`}
                      >
                        {link.poolName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {link.isActive ? (
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border border-primary/20 text-xs" data-testid={`badge-active-${link.id}`}>
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none text-xs opacity-60" data-testid={`badge-inactive-${link.id}`}>
                        Inactive
                      </Badge>
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
                      onClick={() => handleDelete(link.id)}
                      className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      data-testid={`button-delete-link-${link.id}`}
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
  );
}
