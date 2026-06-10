import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetLink, 
  useUpdateLink, 
  useDeleteLink, 
  getGetLinkQueryKey,
  useListPools,
  useRecordLinkClick
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Save, Trash2, MousePointerClick, Calendar, Tag } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LinkDetail() {
  const params = useParams();
  const linkId = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: link, isLoading: isLinkLoading } = useGetLink(linkId, {
    query: { enabled: !!linkId, queryKey: getGetLinkQueryKey(linkId) }
  });
  
  const { data: pools } = useListPools();

  const updateLink = useUpdateLink();
  const deleteLink = useDeleteLink();
  const recordClick = useRecordLinkClick();

  const [editData, setEditData] = useState({ 
    title: "", 
    url: "", 
    description: "", 
    isActive: true,
    poolId: null as number | null
  });

  useEffect(() => {
    if (link) {
      setEditData({
        title: link.title,
        url: link.url,
        description: link.description || "",
        isActive: link.isActive ?? true,
        poolId: link.poolId ?? null
      });
    }
  }, [link]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateLink.mutate({ id: linkId, data: editData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLinkQueryKey(linkId) });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteLink.mutate({ id: linkId }, {
        onSuccess: () => setLocation("/links")
      });
    }
  };

  const handleClick = () => {
    if (link) {
      recordClick.mutate({ id: linkId });
      window.open(link.url, "_blank");
    }
  };

  if (isLinkLoading) return <div className="p-8">Loading link details...</div>;
  if (!link) return <div className="p-8">Link not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      <div className="flex items-center text-sm text-muted-foreground mb-4">
        <Link href="/links" className="hover:text-foreground flex items-center">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Links
        </Link>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{link.title}</h1>
            {link.isActive ? (
              <Badge className="bg-green-500/10 text-green-600 border-none shadow-none">Active</Badge>
            ) : (
              <Badge variant="secondary" className="shadow-none">Inactive</Badge>
            )}
          </div>
          <button 
            onClick={handleClick}
            className="flex items-center text-primary hover:underline group text-lg"
          >
            {link.url}
            <ExternalLink className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100" />
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Link Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" required value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" type="url" required value={editData.url} onChange={e => setEditData({...editData, url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool">Pool Assignment</Label>
                  <Select 
                    value={editData.poolId?.toString() || "unassigned"} 
                    onValueChange={(val) => setEditData({...editData, poolId: val === "unassigned" ? null : parseInt(val)})}
                  >
                    <SelectTrigger id="pool">
                      <SelectValue placeholder="Select a pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No Pool (Unassigned)</SelectItem>
                      {pools?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="active" checked={editData.isActive} onCheckedChange={(c) => setEditData({...editData, isActive: c})} />
                  <Label htmlFor="active">Link is active and trackable</Label>
                </div>
                <div className="pt-4">
                  <Button type="submit" disabled={updateLink.isPending} className="w-full sm:w-auto">
                    {updateLink.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <MousePointerClick className="w-4 h-4 mr-2" /> Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono tracking-tight">{link.clicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Assigned Pool</div>
                  <div className="text-sm font-medium mt-0.5">
                    {link.poolId ? (
                      <Link href={`/pools/${link.poolId}`} className="hover:underline flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ backgroundColor: link.poolColor || 'var(--color-primary)' }} />
                        {link.poolName}
                      </Link>
                    ) : (
                      "Unassigned"
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Created On</div>
                  <div className="text-sm font-medium mt-0.5">
                    {new Date(link.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
