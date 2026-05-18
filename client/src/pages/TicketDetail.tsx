import {
  useTicket,
  useAnalyzeTicket,
  useUpdateTicket,
  useDeleteTicket,
} from "@/hooks/use-tickets";
import { AccessKeyModal } from "@/components/AccessKeyModal";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import { useLocation, useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Trash2,
  BrainCircuit,
  Clock,
  Folder,
  Flag,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatIncidentId } from "@/lib/utils";

export default function TicketDetail() {
  const [, params] = useRoute("/tickets/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");

  const { data: ticket, isLoading, error } = useTicket(id);
  const { mutate: analyze, isPending: isAnalyzing } = useAnalyzeTicket();
  const { mutate: update, isPending: isUpdating } = useUpdateTicket();
  const { mutate: remove, isPending: isDeleting } = useDeleteTicket();
  const { toast } = useToast();

  const [draftResponse, setDraftResponse] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showAccessKeyModal, setShowAccessKeyModal] = useState(false);
  const [pendingAnalyze, setPendingAnalyze] = useState(false);

  // Sync draft response when ticket loads or changes
  useEffect(() => {
    if (ticket?.draftResponse) {
      setDraftResponse(ticket.draftResponse);
    }
  }, [ticket?.draftResponse]);

  if (isLoading) return <LoadingScreen />;
  if (error || !ticket) return <ErrorScreen />;

  const handleStatusChange = (newStatus: string) => {
    update({ id, status: newStatus });
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    remove(id, { onSuccess: () => setLocation("/") });
  };

  const handleAnalyze = () => {
    const key = localStorage.getItem("sentri_access_key");
    if (!key) {
      setPendingAnalyze(true);
      setShowAccessKeyModal(true);
    } else {
      analyze({ id: ticket.id, accessKey: key });
    }
  };

  const handleAccessKeySuccess = () => {
    setShowAccessKeyModal(false);
    if (pendingAnalyze) {
      setPendingAnalyze(false);
      const key = localStorage.getItem("sentri_access_key") ?? "DEMO123";
      analyze({ id: ticket.id, accessKey: key });
    }
  };

  const handleResolve = () => {
    update({ id, status: "resolved" });
  };

  const handleSaveResponse = () => {
    update({ id, draftResponse });
  };

  const getTimeSaved = () => {
    if (!ticket.priority) return 0;

    let baseMinutes = 0;
    const priority = ticket.priority.toLowerCase();

    if (priority === 'critical') baseMinutes = 18;
    else if (priority === 'high') baseMinutes = 15;
    else if (priority === 'medium') baseMinutes = 10;
    else if (priority === 'low') baseMinutes = 6;

    if (ticket.category === 'Malware/Security') {
      baseMinutes += 3;
    }

    return baseMinutes;
  };

  const timeSaved = getTimeSaved();

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              {ticket.status !== "resolved" && (
                <button
                  onClick={handleResolve}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-2 h-9 px-4 bg-green-600 text-white text-sm font-semibold rounded-md shadow-lg shadow-green-900/20 hover:bg-green-500 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Resolve Ticket
                </button>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    aria-label="Delete ticket"
                    className="text-muted-foreground hover:text-destructive p-2 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Delete ticket</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Title Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                  {formatIncidentId(ticket.ticketNumber ?? ticket.id)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ticket.createdAt &&
                    format(new Date(ticket.createdAt), "PPp")}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {ticket.title}
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end gap-1">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Status
                </label>
                <select
                  className="bg-secondary/50 border border-border rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={isUpdating}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex flex-col items-end gap-1">
                <label className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
                  Priority
                </label>
                {ticket.priority && ticket.priority !== "TBD" ? (
                  <PriorityBadge priority={ticket.priority} className="h-9 px-3 text-sm" />
                ) : (
                  <span className="inline-flex items-center h-9 px-3 rounded-md text-sm font-bold border uppercase tracking-wider bg-muted/50 text-muted-foreground border-muted-foreground/30">
                    PENDING
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ticket Original Content */}
          <div className="glass-panel p-6 rounded-xl border border-border/50">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Original Report
            </h3>
            <div className="bg-secondary/30 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap overflow-x-auto border border-border/30">
              {ticket.content}
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="relative">
            {/* AI Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />

            <div className="glass-panel relative p-6 rounded-xl border border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" /> AI Triage Analysis
                </h3>
                {ticket.category && (
                  <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 animate-in fade-in zoom-in duration-500">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-bold text-primary">
                      {timeSaved} min saved
                    </span>
                  </div>
                )}
                {!ticket.category ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground text-sm font-semibold rounded-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BrainCircuit className="w-4 h-4" />
                    )}
                    Run Analysis
                  </button>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BrainCircuit className="w-3 h-3" /> Re-analyze
                  </button>
                )}
              </div>

              {isAnalyzing && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-primary/10 rounded w-3/4"></div>
                  <div className="h-4 bg-primary/10 rounded w-1/2"></div>
                  <div className="h-20 bg-primary/5 rounded w-full"></div>
                </div>
              )}

              {!isAnalyzing && !ticket.category && (
                <div className="text-center py-12 text-muted-foreground">
                  <BrainCircuit className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium text-foreground/60">No analysis yet</p>
                  <p className="text-sm mt-1">Click Run Analysis to let GPT-4o triage this incident automatically</p>
                </div>
              )}

              {!isAnalyzing && ticket.category && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                          <Folder className="w-3.5 h-3.5" /> Category
                        </span>
                        <div className="text-lg font-medium text-foreground">
                          {ticket.category}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
                          <Flag className="w-3.5 h-3.5" /> Recommended Priority
                        </span>
                        <div className="mt-1">
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-accent mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Recommended Actions
                      </h4>
                      <div className="prose prose-sm prose-invert max-w-none text-muted-foreground">
                        {ticket.nextSteps?.split("\n").filter(s => s.trim()).map((step, i) => (
                          <p key={i} className="mb-2 last:mb-0 flex items-start gap-2.5">
                            <span className="shrink-0 text-accent/60 font-mono text-xs mt-0.5 w-4 text-right">{i + 1}.</span>
                            <span>{step.replace(/^[-*\d.]\s*/, "")}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Draft Response */}
          <div className="glass-panel p-6 rounded-xl border border-border/50">
            <div className="flex items-center mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Copy className="w-3.5 h-3.5" />
                Draft Response
              </h3>
            </div>

            {true && (
              <>
                <textarea
                  className="w-full bg-secondary/30 border border-input rounded-md p-4 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground min-h-[200px]"
                  value={draftResponse}
                  onChange={(e) => setDraftResponse(e.target.value)}
                  placeholder="Write a manual draft, or run AI analysis above to generate one automatically."
                />
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
                  <button
                    onClick={handleSaveResponse}
                    disabled={isUpdating}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
                  >
                    {isUpdating ? "Saving..." : "Save Draft"}
                  </button>
                  <button
                    className="bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs px-3 py-1.5 rounded transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(draftResponse);
                      toast({ title: "Copied", description: "Response copied to clipboard." });
                    }}
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <AccessKeyModal
        open={showAccessKeyModal}
        onSuccess={handleAccessKeySuccess}
        onClose={() => { setShowAccessKeyModal(false); setPendingAnalyze(false); }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the ticket and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm">
          Loading ticket details...
        </p>
      </div>
    </div>
  );
}

function ErrorScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl border border-destructive/20 text-center max-w-md">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Ticket Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The ticket you are looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
