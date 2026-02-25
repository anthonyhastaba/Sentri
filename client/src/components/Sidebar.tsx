import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, PlusCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/tickets/new", icon: PlusCircle, label: "New Incident" },
  ];

  const NavContent = ({ onNav }: { onNav?: () => void }) => (
    <>
      <div className="p-6 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tighter text-primary">SENTRI</h1>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Security Operations</p>
        </div>
      </div>
      <nav aria-label="Main navigation" className="flex-1 p-4 space-y-1">
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onNav} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
              isActive
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}>
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile top header bar */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tighter text-primary">SENTRI</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="relative w-64 bg-card border-r border-border flex flex-col h-full">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <NavContent onNav={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="w-64 border-r border-border bg-card/50 flex-col h-screen fixed left-0 top-0 hidden md:flex">
        <NavContent />
      </div>
    </>
  );
}
