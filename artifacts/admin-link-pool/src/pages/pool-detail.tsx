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
import { Plus, Trash2, Edit2, ExternalLink, ArrowLeft, MoreVertical, Link as LinkIcon, Layers } from "lucide-react";
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
      setEditData({
        name: pool.name,
        description: pool.description || "",
        color: pool.color || "#3b82f6"
      });
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
      deletePool.mutate({ id: poolId }, {
        onSuccess: () => setLocation("/pools")
      });
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

  if (isPoolLoading) return <div className="p-8">Loading pool details...</div>;
  if (!pool) return <div className="p-8">Pool not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center text-sm text-muted-foreground mb-2">
        <Link href="/pools" className="hover:text-foreground flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Pools
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: pool.color || 'var(--color-primary)' }}>
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{pool.name}</h1>
            <p className="text-muted-foreground mt-1">{pool.description || "No description provided."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit2 className="w-4 h-4 mr-2" /> Edit Pool</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Pool</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdatePool} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" required value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color Theme</Label>
                  <Input type="color" id="color" className="h-10 p-1 w-full" value={editData.color} onChange={e => setEditData({...editData, color: e.target.value})} />
                </div>
                <Button type="submit" className="w-full" disabled={updatePool.isPending}>
                  {updatePool.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-destructive" onClick={handleDeletePool}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Pool
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-6 py-4 border-y">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Total Links</div>
          <div className="text-2xl font-bold">{pool.linkCount || 0}</div>
        </div>
        <div className="w-px h-10 bg-border" />
        <div>
          <div className="text-sm font-medium text-muted-foreground">Total Clicks</div>
          <div className="text-2xl font-bold">{pool.totalClicks || 0}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Links in Pool</h2>
          <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Add Link</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Link to {pool.name}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLink} className="space-y-4">
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
                  {createLink.isPending ? "Adding..." : "Add Link"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLinksLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading links...</TableCell>
                </TableRow>
              ) : links?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                      <LinkIcon className="w-8 h-8 mb-2 opacity-20" />
                      <p>No links in this pool yet.</p>
                      <Button variant="link" onClick={() => setIsAddLinkOpen(true)} className="mt-1">Add your first link</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                links?.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <Link href={`/links/${link.id}`} className="font-medium hover:underline">
                        {link.title}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate text-muted-foreground">
                      <button onClick={() => handleClick(link.id, link.url)} className="flex items-center gap-1 hover:text-foreground transition-colors group">
                        <ExternalLink className="w-3 h-3 group-hover:text-primary" />
                        <span className="truncate">{link.url}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      {link.isActive ? (
                        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-none">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="shadow-none">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {link.clicks}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteLink(link.id)}>
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
    </div>
  );
}
