import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Check, CheckCircle2, Crown, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  "AI triage & analysis",
  "Unlimited incident tickets",
  "Bulk incident processing",
  "Advanced analytics dashboard",
  "CSV & PDF export",
  "Priority email support",
];

const ENTERPRISE_FEATURES = [
  "Everything in Pro",
  "Team workspace & shared queue",
  "Role-based access control",
  "API access for integrations",
  "Dedicated account manager",
  "Custom onboarding session",
];

export function PremiumModal({ open, onClose }: PremiumModalProps) {
  const [view, setView] = useState<"plans" | "waitlist" | "success">("plans");
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "enterprise" | null>(null);
  const [email, setEmail] = useState("");
  const [waitlistState, setWaitlistState] = useState<"idle" | "loading" | "success">("idle");

  const handleSubscribe = (plan: "pro" | "enterprise") => {
    setSelectedPlan(plan);
    setView("waitlist");
  };

  const handleSuccessClose = () => {
    onClose();
    setView("plans");
    setSelectedPlan(null);
    setEmail("");
    setWaitlistState("idle");
  };

  const handleJoinWaitlist = () => {
    setWaitlistState("loading");
    setTimeout(() => {
      setWaitlistState("success");
      setView("success");
    }, 1000);
  };

  useEffect(() => {
    if (view === "success") {
      const timer = setTimeout(() => {
        handleSuccessClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setView("plans");
      setSelectedPlan(null);
      setEmail("");
      setWaitlistState("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border shadow-2xl">
        <DialogTitle className="sr-only">Upgrade to Sentri Pro</DialogTitle>

        {view === "plans" ? (
          <>
            {/* Header */}
            <div className="text-center space-y-2 pb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Choose your plan</h2>
              <p className="text-sm text-muted-foreground">
                Unlock the full power of Sentri for your team
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Pro card */}
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="self-start text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    MOST POPULAR
                  </span>
                  <span className="self-start text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    PRO
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-foreground">$29</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">For IT teams and help desk leads</p>
                </div>
                <hr className="border-primary/20" />
                <ul className="space-y-2 text-sm text-muted-foreground flex-1">
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe("pro")}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
                >
                  Start Pro Plan
                </button>
              </div>

              {/* Enterprise card */}
              <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="self-start text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    ENTERPRISE
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold text-foreground">$99</span>
                    <span className="text-sm text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">For MSPs and multi-site IT orgs</p>
                </div>
                <hr className="border-border" />
                <ul className="space-y-2 text-sm text-muted-foreground flex-1">
                  {ENTERPRISE_FEATURES.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe("enterprise")}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
                >
                  Start Enterprise Plan
                </button>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground pt-2">
              No credit card required to start. Cancel anytime.
            </p>
          </>
        ) : view === "waitlist" ? (
          <>
            {/* Waitlist view */}
            <div className="text-center space-y-2 pb-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">You're almost there</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Sentri {selectedPlan === "enterprise" ? "Enterprise" : "Pro"} subscriptions open soon. Join the waitlist and we'll email you when billing goes live.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={waitlistState !== "idle"}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              />
              <button
                onClick={handleJoinWaitlist}
                disabled={waitlistState !== "idle" || !email}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  "bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
                )}
              >
                {waitlistState === "idle" && "Join Waitlist"}
                {waitlistState === "loading" && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Joining...
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">You're on the list!</h2>
              <p className="text-sm text-muted-foreground">We'll reach out when your spot is ready.</p>
            </div>
            <button
              onClick={handleSuccessClose}
              className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary hover:bg-primary/90 text-white transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
