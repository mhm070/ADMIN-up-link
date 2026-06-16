import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Layers, Link as LinkIcon, Menu, Plus, Zap } from "lucide-react";
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
              data-testid={`nav-${item.label.toLowerCase()}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer text-sm font-medium",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_12px_hsl(160_84%_45%/0.15)] border border-[hsl(160_84%_45%/0.2)]"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground border border-transparent"
              )}
            >
              <Icon
                size={17}
                className={cn(isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground/40")}
              />
              {item.label}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  const QuickAddDialog = () => (
    <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
      <DialogContent className="glass-card border-[hsl(160_84%_45%/0.15)] shadow-[0_0_40px_hsl(222_47%_4%/0.8)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Quick Add Link
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleQuickAdd} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ql-title">Title</Label>
            <Input
              id="ql-title"
              required
              value={newLink.title}
              onChange={e => setNewLink({ ...newLink, title: e.target.value })}
              placeholder="e.g. Documentation"
              className="bg-[hsl(222_47%_8%)] border-border/60"
              data-testid="input-quick-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ql-url">URL</Label>
            <Input
              id="ql-url"
              type="url"
              required
              value={newLink.url}
              onChange={e => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="https://..."
              className="bg-[hsl(222_47%_8%)] border-border/60"
              data-testid="input-quick-url"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ql-pool">Pool (Optional)</Label>
            <Select
              value={newLink.poolId?.toString() || "unassigned"}
              onValueChange={(val) => setNewLink({ ...newLink, poolId: val === "unassigned" ? null : parseInt(val) })}
            >
              <SelectTrigger id="ql-pool" className="bg-[hsl(222_47%_8%)] border-border/60">
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
          <Button
            type="submit"
            className="w-full btn-glow bg-primary text-primary-foreground font-semibold"
            disabled={createLink.isPending}
            data-testid="button-quick-add-submit"
          >
            {createLink.isPending ? "Adding..." : "Add Link"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-[100dvh] flex w-full bg-background selection:bg-primary/20">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border shrink-0">
          <Link href="/">
            <div className="flex items-center gap-2.5 font-bold tracking-tight cursor-pointer group">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_12px_hsl(160_84%_45%/0.4)] group-hover:shadow-[0_0_18px_hsl(160_84%_45%/0.6)] transition-shadow">
                <LinkIcon size={15} />
              </div>
              <span className="text-sidebar-foreground">Admin Pool</span>
            </div>
          </Link>
        </div>

        {/* Quick add */}
        <div className="px-3 pt-4">
          <Button
            className="w-full justify-start text-sm font-semibold btn-glow bg-primary text-primary-foreground"
            size="sm"
            onClick={() => setIsQuickAddOpen(true)}
            data-testid="button-quick-add"
          >
            <Plus className="mr-2 h-4 w-4" /> Quick Add Link
          </Button>
        </div>

        <NavLinks />

        {/* Version */}
        <div className="p-4 text-[11px] text-sidebar-foreground/25 font-mono tracking-widest">
          v1.0.0
        </div>
      </aside>

      {/* Mobile header */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden h-14 border-b border-border/50 bg-sidebar/80 backdrop-blur flex items-center px-4 justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_10px_hsl(160_84%_45%/0.4)]">
              <LinkIcon size={15} />
            </div>
            <span className="font-bold tracking-tight">Admin Pool</span>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-60 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground">
              <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2.5 font-bold tracking-tight">
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_10px_hsl(160_84%_45%/0.4)]">
                    <LinkIcon size={15} />
                  </div>
                  <span>Admin Pool</span>
                </div>
              </div>
              <div className="px-3 pt-4">
                <Button
                  className="w-full justify-start text-sm font-semibold btn-glow bg-primary text-primary-foreground"
                  size="sm"
                  onClick={() => { setMobileMenuOpen(false); setIsQuickAddOpen(true); }}
                  data-testid="button-mobile-quick-add"
                >
                  <Plus className="mr-2 h-4 w-4" /> Quick Add Link
                </Button>
              </div>
              <NavLinks onClick={() => setMobileMenuOpen(false)} />
            </SheetContent>
          </Sheet>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>

      <QuickAddDialog />
    </div>
  );
}
