import { useState } from "react";
import { useListLinks, useCreateLink, useDeleteLink, getListLinksQueryKey, useRecordLinkClick } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Trash2, ExternalLink, MousePointerClick } from "lucide-react";
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
          <p className="text-muted-foreground mt-1">Manage all URLs across your pools.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Link</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" required value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input id="url" type="url" required value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={newLink.description} onChange={e => setNewLink({...newLink, description: e.target.value})} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="active" checked={newLink.isActive} onCheckedChange={(c) => setNewLink({...newLink, isActive: c})} />
                <Label htmlFor="active">Active</Label>
              </div>
              <Button type="submit" className="w-full" disabled={createLink.isPending}>
                {createLink.isPending ? "Creating..." : "Create Link"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search links..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Pool</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : links?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No links found</TableCell>
              </TableRow>
            ) : (
              links?.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    <button onClick={() => handleClick(link.id, link.url)} className="flex items-center gap-1 hover:text-foreground transition-colors group">
                      <ExternalLink className="w-3 h-3 group-hover:text-primary" />
                      <span className="truncate">{link.url}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    {link.poolName ? (
                      <Badge variant="outline" style={{ borderColor: link.poolColor || 'inherit' }}>
                        {link.poolName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {link.isActive ? (
                      <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="shadow-none">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    <div className="flex items-center justify-end gap-1.5">
                      {link.clicks}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
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
