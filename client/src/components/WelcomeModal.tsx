import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, DatabaseZap, KeyRound } from "lucide-react";

export function WelcomeModal() {
  const [open, setOpen] = useState(() => !localStorage.getItem("sentri_welcome_shown"));

  const handleGetStarted = () => {
    localStorage.setItem("sentri_welcome_shown", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleGetStarted(); }}>
      <DialogContent className="max-w-lg bg-card border-border shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold">Welcome to Sentri</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Your AI-powered incident triage hub. Here's how to get started:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
            <DatabaseZap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Load sample incidents</p>
              <p className="text-sm text-muted-foreground">Use the "Load Demo Incidents" button to populate the dashboard with realistic IT incident examples.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
            <KeyRound className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">AI analysis</p>
              <p className="text-sm text-muted-foreground">Enter your access key when prompted to unlock GPT-4o triage analysis on any ticket.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
            <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Bulk triage</p>
              <p className="text-sm text-muted-foreground">Select multiple tickets from the dashboard and run bulk AI analysis in one click.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleGetStarted} className="w-full">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
