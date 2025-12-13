import { Link, useLocation } from "wouter";
import { ShieldAlert, LayoutDashboard, PlusCircle, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/tickets/new", icon: PlusCircle, label: "New Incident" },
    // { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col h-screen fixed left-0 top-0 hidden md:flex">
      <div className="p-6 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tighter text-primary">SENTRI</h1>
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Security Operations</p>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</p>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
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
      <div className="p-4 border-t border-border/50">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
