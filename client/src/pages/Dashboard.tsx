import { useTickets } from "@/hooks/use-tickets";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { Link } from "wouter";
import { Loader2, AlertCircle, ArrowRight, Search, Activity, ShieldCheck, Clock, CheckSquare, Square, Zap, CheckCircle2, FileText, Download, Copy, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: tickets, isLoading, error } = useTickets();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number; totalTimeSaved: number } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-primary">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-destructive">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto" />
          <h2 className="text-2xl font-bold">Failed to load dashboard</h2>
          <p className="text-muted-foreground">Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  const activeTickets = tickets?.filter(t => t.status !== 'resolved' && t.status !== 'closed') || [];
  const criticalCount = tickets?.filter(t => t.priority?.toLowerCase() === 'critical' && t.status !== 'resolved').length || 0;
  
  // For "Resolved Today", we filter by status 'resolved' and check if createdAt is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  const resolvedTodayCount = tickets?.filter(t => 
    t.status === 'resolved' && t.createdAt && isToday(new Date(t.createdAt))
  ).length || 0;

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

  const handleBulkAnalyze = async () => {
    if (selectedIds.length === 0) return;
    
    setIsBulkAnalyzing(true);
    setBulkResult(null);
    try {
      const res = await apiRequest("POST", "/api/tickets/bulk-analyze", { ids: selectedIds });
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

  const generateReport = () => {
    if (!tickets) return "";

    const today = new Date();
    const triagedToday = tickets.filter(t => t.createdAt && isToday(new Date(t.createdAt)));
    const resolved = triagedToday.filter(t => t.status === 'resolved');
    const active = tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed');
    const critical = active.filter(t => t.priority?.toLowerCase() === 'critical');
    
    const categoryBreakdown = tickets.reduce((acc: Record<string, number>, t) => {
      if (t.category) {
        acc[t.category] = (acc[t.category] || 0) + 1;
      }
      return acc;
    }, {});

    const calculateTimeSaved = (ticket: any) => {
      if (!ticket.priority) return 0;
      let base = 0;
      const p = ticket.priority.toLowerCase();
      if (p === 'critical') base = 18;
      else if (p === 'high') base = 15;
      else if (p === 'medium') base = 10;
      else if (p === 'low') base = 6;
      if (ticket.category === 'Malware/Security') base += 3;
      return base;
    };

    const totalTimeSaved = tickets.reduce((acc, t) => acc + calculateTimeSaved(t), 0);
    const highPriorityAlerts = active.filter(t => 
      t.priority?.toLowerCase() === 'critical' || t.priority?.toLowerCase() === 'high'
    );

    let report = `SENTRI INCIDENT SUMMARY - ${format(today, 'PPPP')}\n`;
    report += `====================================================\n\n`;
    report += `EXECUTIVE SUMMARY\n`;
    report += `-----------------\n`;
    report += `Total Tickets Triaged Today: ${triagedToday.length}\n`;
    report += `Resolved Today:              ${resolved.length}\n`;
    report += `Current Active Incidents:    ${active.length}\n`;
    report += `Critical Threats:            ${critical.length}\n`;
    report += `Total AI Time Saved:         ~${totalTimeSaved} minutes\n\n`;

    report += `CATEGORY BREAKDOWN\n`;
    report += `------------------\n`;
    Object.entries(categoryBreakdown).forEach(([cat, count]) => {
      report += `${cat.padEnd(20)}: ${count}\n`;
    });
    if (Object.keys(categoryBreakdown).length === 0) report += "No categories assigned yet.\n";
    report += `\n`;

    report += `HIGH PRIORITY ALERTS REQUIRING ATTENTION\n`;
    report += `----------------------------------------\n`;
    highPriorityAlerts.forEach(t => {
      report += `[${t.priority?.toUpperCase()}] #${t.id}: ${t.title}\n`;
    });
    if (highPriorityAlerts.length === 0) report += "No high priority alerts pending.\n";

    return report;
  };

  const reportText = generateReport();

  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([reportText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `sentri-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyReport = () => {
    navigator.clipboard.writeText(reportText);
    toast({
      title: "Report Copied",
      description: "Incident summary has been copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-glow uppercase">Sentri <span className="text-primary/50 text-xl font-light">Command Center</span></h1>
              <p className="text-muted-foreground mt-1">Real-time security incident triage & automated response</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowReport(true)}
                className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </button>
              <Link href="/tickets/new" className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6 py-2 shadow-primary/25">
                New Incident
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Active Incidents" 
              value={activeTickets.length} 
              icon={Activity}
              trend="Current Load"
              color="text-blue-400"
            />
            <MetricCard 
              title="Critical Threats" 
              value={criticalCount} 
              icon={AlertCircle}
              trend="Requires Attention"
              color="text-red-500"
              borderColor="border-red-500/20"
            />
            <MetricCard 
              title="Resolved (Today)" 
              value={resolvedTodayCount} 
              icon={ShieldCheck}
              trend="Target: 10+"
              color="text-green-400"
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
                      Total efficiency gain: <span className="text-green-500 font-bold">~{bulkResult.totalTimeSaved} minutes</span> saved.
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

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Recent Tickets
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{tickets?.length}</span>
            </h2>
            <div className="relative w-64 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                placeholder="Search tickets..." 
                className="w-full bg-secondary/50 border border-border rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4 w-10">
                      <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-primary transition-colors">
                        {selectedIds.length === tickets?.length && tickets?.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-right">Created</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {tickets?.map((ticket) => (
                    <motion.tr 
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        "hover:bg-primary/5 transition-colors group",
                        selectedIds.includes(ticket.id) && "bg-primary/5"
                      )}
                    >
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => toggleSelect(ticket.id)}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {selectedIds.includes(ticket.id) ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">#{ticket.id}</td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {ticket.title}
                        <div className="md:hidden mt-1 text-xs text-muted-foreground truncate max-w-[200px]">{ticket.content}</div>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={ticket.status} /></td>
                      <td className="px-6 py-4"><PriorityBadge priority={ticket.priority} /></td>
                      <td className="px-6 py-4 text-muted-foreground">{ticket.category || "—"}</td>
                      <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {ticket.createdAt ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true }) : 'Just now'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/tickets/${ticket.id}`} className="inline-flex items-center justify-center p-2 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                  {tickets?.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                        No tickets found. <Link href="/tickets/new" className="text-primary hover:underline">Create one</Link> to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={showReport} onOpenChange={setShowReport}>
        <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Daily Incident Summary
            </DialogTitle>
            <DialogDescription>
              Professional report summarizing security activity and response efficiency.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <pre className="bg-secondary/50 p-6 rounded-lg font-mono text-xs leading-relaxed overflow-y-auto max-h-[400px] border border-border/50 text-foreground">
              {reportText}
            </pre>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={handleCopyReport}
              className="flex-1"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </Button>
            <Button 
              variant="default" 
              onClick={handleDownloadReport}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Download .txt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, borderColor = "border-border/50" }: any) {
  return (
    <div className={`glass-panel p-6 rounded-xl border ${borderColor} relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
        <Icon className="w-16 h-16" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 ${color} tracking-tight`}>{value}</h3>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span className="bg-secondary px-1.5 py-0.5 rounded">{trend}</span>
        </div>
      </div>
    </div>
  );
}
