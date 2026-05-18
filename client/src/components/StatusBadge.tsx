import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const variants: Record<string, string> = {
    new: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
    open: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
    in_progress: "bg-primary/20 text-primary border-primary/30",
    resolved: "bg-green-500/20 text-green-400 border-green-500/30",
    closed: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
  };

  const labels: Record<string, string> = {
    new: "New",
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide",
      variants[normalized] || variants.new,
      className
    )}>
      {labels[normalized] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority?: string | null, className?: string }) {
  const normalized = priority?.toLowerCase();

  const variants: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const variantClass = normalized && variants[normalized]
    ? variants[normalized]
    : "bg-muted/50 text-muted-foreground border-muted-foreground/30";
  const label = (priority ?? "Pending").toUpperCase();

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider",
      variantClass,
      className
    )}>
      {label}
    </span>
  );
}
