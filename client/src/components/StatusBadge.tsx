import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const variants: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    resolved: "bg-green-500/10 text-green-400 border-green-500/20",
    closed: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wide",
      variants[normalized] || variants.new,
      className
    )}>
      {status.replace("_", " ")}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority?: string | null, className?: string }) {
  if (!priority) return null;
  
  const normalized = priority.toLowerCase();
  
  const variants: Record<string, string> = {
    critical: "bg-red-500/15 text-red-500 border-red-500/30 shadow-[0_0_10px_-3px_rgba(239,68,68,0.4)] animate-pulse",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider",
      variants[normalized] || variants.low,
      className
    )}>
      {priority}
    </span>
  );
}
