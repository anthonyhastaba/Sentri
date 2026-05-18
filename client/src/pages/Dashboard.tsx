import { useTickets } from "@/hooks/use-tickets";
import { DemoLoader } from "@/components/DemoLoader";
import { AccessKeyModal } from "@/components/AccessKeyModal";
import { PremiumModal } from "@/components/PremiumModal";
import { Sidebar } from "@/components/Sidebar";
import { IncidentTable } from "@/components/IncidentTable";
import { Link } from "wouter";
import { AlertCircle, Activity, ShieldCheck, CheckSquare, Zap, CheckCircle2, Lock, Loader2, Clock, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";


export default function Dashboard() {
  const { data: tickets, isLoading, error } = useTickets();
  const { getToken } = useAuth();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; totalTimeSaved: number } | null>(null);
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
          <div className="mb-8 space-y-4">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
            </div>
          </div>
          <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border/50">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    const message = error instanceof Error ? error.message : "Please check your connection and try again.";
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-destructive">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="w-16 h-16 mx-auto" />
          <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
          <p className="text-muted-foreground break-words">{message}</p>
        </div>
      </div>
    );
  }

  const activeTickets = tickets?.filter(t => t.status !== 'resolved' && t.status !== 'closed') || [];
  const criticalCount = tickets?.filter(t => t.priority?.toLowerCase() === 'critical' && t.status !== 'resolved').length || 0;
  const totalResolvedCount = tickets?.filter(t => t.status === 'resolved').length || 0;

  const TIME_BY_PRIORITY: Record<string, number> = {
    critical: 18,
    high: 15,
    medium: 10,
    low: 6,
  };

  const handleDownloadReport = () => {
    const rows = tickets ?? [];

    const formatStatus = (s: string) => {
      const map: Record<string, string> = {
        new: "New", in_progress: "In Progress",
        resolved: "Resolved", closed: "Closed",
      };
      return map[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    };

    const formatPriority = (p: string | null | undefined) =>
      p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "Pending";

    const cell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const header = [
      "Ticket #", "Title", "Status", "Priority", "Category",
      "Created", "Time Saved", "Next Steps Summary", "Draft Response Preview",
    ];

    const csvRows = rows.map(t => {
      const ticketNum = t.ticketNumber != null
        ? `INC-${String(t.ticketNumber).padStart(4, "0")}`
        : "INC-????";

      const created = t.createdAt
        ? format(new Date(t.createdAt as unknown as string), "MMM d, yyyy 'at' h:mm a")
        : "";

      const timeSaved = t.priority
        ? `~${TIME_BY_PRIORITY[t.priority.toLowerCase()] ?? "?"} min`
        : "—";

      const firstStep = t.nextSteps
        ? (t.nextSteps.split("\n").find(l => l.trim()) ?? "").replace(/^[-*]\s*/, "").trim()
        : "";
      const nextStepsSummary = firstStep
        ? firstStep.length > 80 ? firstStep.slice(0, 80) + "..." : firstStep
        : "Pending analysis";

      const draftPreview = t.draftResponse
        ? t.draftResponse.length > 100
          ? t.draftResponse.slice(0, 100) + "..."
          : t.draftResponse
        : "Pending analysis";

      return [
        cell(ticketNum),
        cell(t.title ?? ""),
        cell(formatStatus(t.status ?? "")),
        cell(formatPriority(t.priority)),
        cell(t.category ?? "Not analyzed"),
        cell(created),
        cell(timeSaved),
        cell(nextStepsSummary),
        cell(draftPreview),
      ].join(",");
    });

    const csv = [header.map(h => cell(h)).join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sentri-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTimeSavedMin = tickets?.reduce((sum, t) => {
    if (!t.priority) return sum;
    return sum + (TIME_BY_PRIORITY[t.priority.toLowerCase()] ?? 0);
  }, 0) ?? 0;

  const timeSavedDisplay = totalTimeSavedMin >= 60
    ? `${Math.floor(totalTimeSavedMin / 60)} hr ${totalTimeSavedMin % 60} min`
    : `${totalTimeSavedMin} min`;

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tickets?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tickets?.map(t => t.id) || []);
    }
  };

  const executeBulkAnalyze = async (accessKey: string) => {
    setIsBulkAnalyzing(true);
    setBulkResult(null);
    try {
      const token = await getToken();
      const res = await apiRequest(
        "POST",
        "/api/tickets/bulk-analyze",
        { ids: selectedIds, accessKey },
        { Authorization: `Bearer ${token}` },
      );
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setBulkResult({ count: data.count, totalTimeSaved: data.totalTimeSaved });
      setSelectedIds([]);
      toast({
        title: "Bulk Triage Complete",
        description: `Successfully analyzed ${data.count} tickets.`,
      });
    } catch (err) {
      toast({
        title: "Bulk Triage Failed",
        description: "An error occurred during bulk analysis.",
        variant: "destructive",
      });
    } finally {
      setIsBulkAnalyzing(false);
    }
  };

  const handleBulkAnalyze = async () => {
    if (selectedIds.length === 0) return;
    const key = localStorage.getItem("sentri_access_key");
    if (!key) {
      setShowAccessKeyModal(true);
      return;
    }
    await executeBulkAnalyze(key);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto pt-14 md:pt-8">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-glow uppercase">Sentri <span className="text-muted-foreground text-xl font-light normal-case">Operations Hub</span></h1>
              <p className="text-muted-foreground mt-1">AI-powered IT incident management</p>
            </div>
            <div className="flex items-center gap-3">
              <DemoLoader />
              <button
                onClick={() => setShowPremium(true)}
                className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <Lock className="w-4 h-4 mr-2" />
                Export Report
              </button>
              <Link href="/tickets/new" className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2 shadow-primary/25">
                New Incident
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Active Incidents"
              value={activeTickets.length}
              icon={Activity}
              trend="Current Load"
              color="text-primary"
            />
            <MetricCard
              title="Critical Incidents"
              value={criticalCount}
              icon={AlertCircle}
              trend={criticalCount > 0 ? "Requires Attention" : "All Clear"}
              color={criticalCount > 0 ? "text-red-500" : "text-muted-foreground"}
              iconColor={criticalCount > 0 ? "text-red-500" : "text-muted-foreground/50"}
              trendColor={criticalCount > 0 ? "text-red-400" : "text-green-400"}
              borderColor={criticalCount > 0 ? "border-red-500/20" : "border-border/50"}
              glow={criticalCount > 0}
            />
            <MetricCard
              title="Total Resolved"
              value={totalResolvedCount}
              icon={ShieldCheck}
              trend="All time"
              color={totalResolvedCount > 0 ? "text-green-400" : "text-muted-foreground"}
            />
            <MetricCard
              title="Time Saved"
              value={timeSavedDisplay}
              icon={Clock}
              trend="AI-triaged tickets"
              color="text-accent"
            />
          </div>
        </header>

        <section className="space-y-4">
          <AnimatePresence>
            {selectedIds.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-panel p-4 rounded-xl border-primary/30 bg-primary/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <CheckSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">{selectedIds.length} Tickets Selected</p>
                      <p className="text-xs text-muted-foreground">Perform automated triage on all selected items</p>
                    </div>
                  </div>
                  <button
                    onClick={handleBulkAnalyze}
                    disabled={isBulkAnalyzing}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50"
                  >
                    {isBulkAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Run Bulk Analysis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {bulkResult && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-panel p-6 rounded-xl border-green-500/30 bg-green-500/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold">Bulk Triage Summary</h4>
                    <p className="text-sm text-muted-foreground">
                      Successfully processed <span className="text-foreground font-bold">{bulkResult.count}</span> tickets.
                      <span className="text-green-500 font-bold">{bulkResult.totalTimeSaved} min</span> saved on triage.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setBulkResult(null)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <IncidentTable
            tickets={tickets ?? []}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        </section>
      </main>

      <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} />

      <AccessKeyModal
        open={showAccessKeyModal}
        onSuccess={() => {
          setShowAccessKeyModal(false);
          const key = localStorage.getItem("sentri_access_key") ?? "DEMO123";
          executeBulkAnalyze(key);
        }}
        onClose={() => setShowAccessKeyModal(false)}
      />

    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend: string;
  color: string;
  iconColor?: string;
  trendColor?: string;
  borderColor?: string;
  glow?: boolean;
}

function MetricCard({ title, value, icon: Icon, trend, color, iconColor, trendColor, borderColor = "border-border/50", glow }: MetricCardProps) {
  return (
    <div className={cn(`glass-panel p-6 rounded-xl border ${borderColor} relative overflow-hidden group`, glow && "shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]")}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${iconColor ?? color}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 ${color} tracking-tight`}>{value}</h3>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className={cn("bg-secondary px-1.5 py-0.5 rounded", trendColor)}>{trend}</span>
        </div>
      </div>
    </div>
  );
}
