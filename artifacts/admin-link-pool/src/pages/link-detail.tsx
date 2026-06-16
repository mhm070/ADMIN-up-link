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
import { ArrowLeft, ExternalLink, Save, Trash2, MousePointerClick, Calendar, Tag, Zap } from "lucide-react";
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
      deleteLink.mutate({ id: linkId }, { onSuccess: () => setLocation("/links") });
    }
  };

  const handleClick = () => {
    if (link) {
      recordClick.mutate({ id: linkId });
      window.open(link.url, "_blank");
    }
  };

  if (isLinkLoading) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground font-mono text-sm animate-pulse">
      loading link...
    </div>
  );
  if (!link) return (
    <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
      Link not found.
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <Link href="/links" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium" data-testid="link-back-links">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Links
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="link-title">{link.title}</h1>
            {link.isActive ? (
              <Badge className="bg-primary/10 text-primary border border-primary/20 shadow-none text-xs" data-testid="badge-link-active">Active</Badge>
            ) : (
              <Badge variant="secondary" className="shadow-none text-xs opacity-60" data-testid="badge-link-inactive">Inactive</Badge>
            )}
          </div>
          <button
            onClick={handleClick}
            className="flex items-center gap-1.5 text-primary hover:text-primary/70 transition-colors text-sm font-mono group"
            data-testid="button-open-link"
          >
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
            <span className="hover:underline underline-offset-2 truncate max-w-[400px]">{link.url}</span>
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
          onClick={handleDelete}
          data-testid="button-delete-link"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
        </Button>
      </div>

      {/* Two-col layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Edit form */}
        <div className="md:col-span-2">
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary" /> Edit Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
                  <Input
                    id="edit-title"
                    required
                    value={editData.title}
                    onChange={e => setEditData({ ...editData, title: e.target.value })}
                    className="bg-[hsl(222_47%_8%)] border-border/60"
                    data-testid="input-edit-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-url" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">URL</Label>
                  <Input
                    id="edit-url"
                    type="url"
                    required
                    value={editData.url}
                    onChange={e => setEditData({ ...editData, url: e.target.value })}
                    className="bg-[hsl(222_47%_8%)] border-border/60 font-mono text-sm"
                    data-testid="input-edit-url"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-desc" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</Label>
                  <Input
                    id="edit-desc"
                    value={editData.description}
                    onChange={e => setEditData({ ...editData, description: e.target.value })}
                    className="bg-[hsl(222_47%_8%)] border-border/60"
                    data-testid="input-edit-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-pool" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pool Assignment</Label>
                  <Select
                    value={editData.poolId?.toString() || "unassigned"}
                    onValueChange={(val) => setEditData({ ...editData, poolId: val === "unassigned" ? null : parseInt(val) })}
                  >
                    <SelectTrigger id="edit-pool" className="bg-[hsl(222_47%_8%)] border-border/60" data-testid="select-edit-pool">
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
                <div className="flex items-center space-x-2 py-1">
                  <Switch
                    id="edit-active"
                    checked={editData.isActive}
                    onCheckedChange={(c) => setEditData({ ...editData, isActive: c })}
                    data-testid="switch-edit-active"
                  />
                  <Label htmlFor="edit-active" className="text-sm cursor-pointer">Link is active and trackable</Label>
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={updateLink.isPending}
                    className="btn-glow bg-primary text-primary-foreground font-semibold w-full sm:w-auto"
                    data-testid="button-save-link"
                  >
                    {updateLink.isPending
                      ? "Saving..."
                      : <><Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes</>
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar stats */}
        <div className="space-y-4">
          {/* Click counter */}
          <Card className="glass-card stat-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="w-3.5 h-3.5 text-primary" /> Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold font-mono neon-text" data-testid="text-click-count">{link.clicks}</div>
            </CardContent>
          </Card>

          {/* Meta info */}
          <Card className="glass-card">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Tag className="w-3.5 h-3.5 text-primary/60" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Pool</div>
                  <div className="text-sm font-medium mt-0.5" data-testid="text-pool-name">
                    {link.poolId ? (
                      <Link href={`/pools/${link.poolId}`} className="hover:text-primary transition-colors flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: link.poolColor || '#22c55e', boxShadow: `0 0 6px ${link.poolColor || '#22c55e'}80` }}
                        />
                        {link.poolName}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/60 text-xs">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-border/40" />

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary/60" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Created</div>
                  <div className="text-sm font-medium mt-0.5 font-mono" data-testid="text-created-at">
                    {new Date(link.createdAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "short", day: "numeric"
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
