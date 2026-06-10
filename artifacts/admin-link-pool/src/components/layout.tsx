import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Layers, Link as LinkIcon, Menu, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useCreateLink, useListPools, getListLinksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", isActive: true, poolId: null as number | null });
  const createLink = useCreateLink();
  const queryClient = useQueryClient();
  const { data: pools } = useListPools();

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createLink.mutate({ data: newLink }, {
      onSuccess: () => {
        setIsQuickAddOpen(false);
        setNewLink({ title: "", url: "", description: "", isActive: true, poolId: null });
        queryClient.invalidateQueries({ queryKey: getListLinksQueryKey() });
      }
    });
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/pools", label: "Pools", icon: Layers },
    { href: "/links", label: "Links", icon: LinkIcon },
  ];

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
      {navItems.map((item) => {
        const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} onClick={onClick}>
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon size={18} />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] flex w-full bg-background selection:bg-primary/20">
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col shrink-0">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2 font-bold tracking-tight cursor-pointer">
              <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <LinkIcon size={16} />
              </div>
              <span>Admin Pool</span>
            </div>
          </Link>
        </div>
        <div className="px-3 pt-4">
          <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full justify-start text-sm shadow-sm font-medium" size="sm">
                <Plus className="mr-2 h-4 w-4" /> Quick Add Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Quick Add Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" required value={newLink.title} onChange={e => setNewLink({...newLink, title: e.target.value})} placeholder="e.g. Documentation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" type="url" required value={newLink.url} onChange={e => setNewLink({...newLink, url: e.target.value})} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool">Pool (Optional)</Label>
                  <Select 
                    value={newLink.poolId?.toString() || "unassigned"} 
                    onValueChange={(val) => setNewLink({...newLink, poolId: val === "unassigned" ? null : parseInt(val)})}
                  >
                    <SelectTrigger id="pool">
                      <SelectValue placeholder="Select a pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">No Pool</SelectItem>
                      {pools?.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createLink.isPending}>
                  {createLink.isPending ? "Adding..." : "Add Link"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <NavLinks />
        <div className="p-4 text-xs text-sidebar-foreground/40 font-medium">
          v1.0.0
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 border-b border-border bg-card flex items-center px-4 justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <LinkIcon size={16} />
            </div>
            <span className="font-bold tracking-tight">Admin Pool</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-foreground">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground">
              <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                  <div className="w-7 h-7 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <LinkIcon size={16} />
                  </div>
                  <span>Admin Pool</span>
                </div>
              </div>
              <div className="px-3 pt-4">
                <Button className="w-full justify-start text-sm shadow-sm font-medium" size="sm" onClick={() => { setMobileMenuOpen(false); setIsQuickAddOpen(true); }}>
                  <Plus className="mr-2 h-4 w-4" /> Quick Add Link
                </Button>
              </div>
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <div className="flex-1 overflow-auto bg-background/50">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}