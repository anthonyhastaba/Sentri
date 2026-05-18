import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useClerk } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  Sparkles,
  ExternalLink,
  Check,
  ChevronRight,
  Menu,
  X,
  Zap,
  Brain,
  Lock,
  Clock,
  CheckCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

/* ───────────────── Floating Navbar ───────────────── */
function FloatingNav({
  scrollTo,
  openSignIn,
  openSignUp,
}: {
  scrollTo: (id: string) => void;
  openSignIn: () => void;
  openSignUp: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Features", id: "features" },
    { label: "How It Works", id: "how-it-works" },
    { label: "Pricing", id: "pricing" },
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full py-4 px-4">
      <motion.div
        className={cn(
          "flex items-center justify-between px-6 py-3 rounded-full w-full max-w-3xl relative z-10 transition-all duration-300",
          scrolled
            ? "bg-card/80 backdrop-blur-xl border border-border/40 shadow-[0_0_30px_rgba(0,0,0,0.3)]"
            : "bg-transparent"
        )}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold tracking-tight">Sentri</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              whileHover={{ scale: 1.05 }}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => openSignIn()}
            className="text-sm text-foreground/80 hover:text-foreground transition"
          >
            Sign In
          </button>
          <motion.button
            onClick={() => openSignUp()}
            className="text-sm bg-primary hover:bg-primary/80 text-primary-foreground rounded-full px-5 py-2 font-semibold transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </div>

        <motion.button
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.9 }}
        >
          <Menu className="h-5 w-5 text-foreground" />
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-background z-50 pt-24 px-6 md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <motion.button
              className="absolute top-6 right-6 p-2"
              onClick={() => setIsOpen(false)}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-6 w-6 text-foreground" />
            </motion.button>
            <div className="flex flex-col space-y-6">
              {navItems.map((item, i) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    scrollTo(item.id);
                    setIsOpen(false);
                  }}
                  className="text-base text-foreground font-medium text-left"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.button
                onClick={() => {
                  openSignUp();
                  setIsOpen(false);
                }}
                className="bg-primary text-primary-foreground rounded-full py-3 font-semibold mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Get Started
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────── Illuminated Text ───────────────── */
function GlowText({ children }: { children: string }) {
  return (
    <span
      className="text-primary relative inline-block"
      style={{
        textShadow:
          "0 0 10px rgba(59,130,246,0.8), 0 0 30px rgba(59,130,246,0.5), 0 0 60px rgba(59,130,246,0.3), 0 0 100px rgba(59,130,246,0.15)",
      }}
    >
      {children}
    </span>
  );
}

/* ───────────────── Feature Card Animations ───────────────── */
function TriageAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 4), 1500);
    return () => clearInterval(interval);
  }, []);

  const labels = ["Classifying...", "Setting Priority", "Generating Steps", "Done"];
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <motion.div
        className="relative w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center"
        animate={{ rotate: step * 90 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <Brain className="w-8 h-8 text-primary" />
      </motion.div>
      <motion.span
        key={step}
        className="text-xs text-muted-foreground font-mono"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
      >
        {labels[step]}
      </motion.span>
    </div>
  );
}

function SpeedAnimation() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTime((t) => (t >= 3 ? 0 : t + 0.1)), 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <span className="text-3xl font-bold text-foreground font-mono">
        {time.toFixed(1)}s
      </span>
      <span className="text-xs text-muted-foreground">Analysis Time</span>
      <div className="w-24 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${Math.min(time / 3 * 100, 100)}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
}

function ShieldAnimation() {
  const [locked, setLocked] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setLocked((l) => !l), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <motion.div
        animate={{ scale: locked ? 1 : 1.1 }}
        transition={{ duration: 0.3 }}
      >
        <Lock className={cn("w-10 h-10 transition-colors duration-300", locked ? "text-green-400" : "text-primary")} />
      </motion.div>
      <span className="text-xs text-muted-foreground">
        {locked ? "Data Isolated" : "Per-User Encryption"}
      </span>
    </div>
  );
}

/* ───────────────── Border Trail (Pricing) ───────────────── */
function BorderTrail({ size = 60 }: { size?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className="absolute aspect-square bg-primary/60"
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          boxShadow: "0px 0px 60px 30px rgba(59,130,246,0.3)",
        }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
      />
    </div>
  );
}

/* ───────────────── Pricing Toggle ───────────────── */
type Frequency = "monthly" | "yearly";

function PricingToggle({
  frequency,
  setFrequency,
}: {
  frequency: Frequency;
  setFrequency: (f: Frequency) => void;
}) {
  return (
    <div className="bg-muted/30 flex w-fit rounded-full border border-border/50 p-1 mx-auto">
      {(["monthly", "yearly"] as const).map((freq) => (
        <button
          key={freq}
          onClick={() => setFrequency(freq)}
          className="relative px-5 py-1.5 text-sm capitalize"
        >
          <span className="relative z-10">{freq}</span>
          {frequency === freq && (
            <motion.span
              layoutId="freq-pill"
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-primary absolute inset-0 z-0 rounded-full"
              style={{ opacity: 0.2 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/*                    LANDING PAGE                     */
/* ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const { openSignIn, openSignUp } = useClerk();
  const [frequency, setFrequency] = useState<Frequency>("monthly");

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const plans = [
    {
      name: "Starter",
      info: "For individuals and small teams",
      price: { monthly: 0, yearly: 0 },
      features: ["50 tickets/month", "GPT-4o analysis", "Draft responses", "Email support"],
      cta: "Get Started Free",
      highlighted: false,
    },
    {
      name: "Pro",
      info: "For growing IT and help desk teams",
      price: { monthly: 29, yearly: 290 },
      features: ["Unlimited tickets", "Bulk triage", "ROI dashboard", "Priority support", "Team workspaces", "API access"],
      cta: "Start Pro Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      info: "For IT orgs and MSPs at scale",
      price: { monthly: 99, yearly: 990 },
      features: ["Custom ticket volume", "SSO / SAML", "Data isolation SLA", "Dedicated support", "Audit logs", "Custom integrations"],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float-orb {
            0%, 100% { transform: translateY(0) translateX(-50%); }
            50% { transform: translateY(-24px) translateX(-50%); }
          }
          @keyframes fade-up {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up { animation: fade-up 0.6s ease both; }
          .animate-fade-up-1 { animation: fade-up 0.6s 0.1s ease both; }
          .animate-fade-up-2 { animation: fade-up 0.6s 0.2s ease both; }
          .animate-fade-up-3 { animation: fade-up 0.6s 0.3s ease both; }
          .animate-fade-up-4 { animation: fade-up 0.6s 0.4s ease both; }
          .orb { animation: float-orb 8s ease-in-out infinite; }
        `
      }} />

      {/* ── Floating Navbar ─────────────────────────── */}
      <FloatingNav scrollTo={scrollTo} openSignIn={() => openSignIn()} openSignUp={() => openSignUp()} />

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Floating orb */}
        <div
          className="orb absolute top-1/3 left-1/2 w-[640px] h-[360px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-sm rounded-full px-4 py-1.5 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Powered by GPT-4o</span>
          </motion.div>

          {/* H1 with illuminated glow */}
          <motion.h1
            className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Stop triaging tickets
            <br />
            <GlowText>manually.</GlowText>
          </motion.h1>

          <motion.p
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Sentri uses GPT-4o to instantly classify every IT incident, generate a step-by-step
            runbook referencing real enterprise tools, and draft a professional response — so your
            team focuses on fixing, not triaging.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.button
              onClick={() => openSignUp()}
              className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold rounded-full px-8 py-3.5 transition text-base shadow-[0_0_24px_rgba(59,130,246,0.35)]"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Get Started
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="flex items-center gap-2 border border-border/60 hover:border-border text-foreground/90 rounded-full px-8 py-3.5 transition text-base"
            >
              See How It Works
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="flex items-center justify-center gap-3 text-sm text-muted-foreground/70 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span>Free to start</span>
            <span className="text-muted-foreground/30">·</span>
            <span>No credit card</span>
            <span className="text-muted-foreground/30">·</span>
            <span>Cancel anytime</span>
          </motion.div>

          {/* Tech stack trust bar */}
          <motion.div
            className="flex items-center justify-center mb-16 text-sm text-muted-foreground/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <span>Built with</span>
            {["React", "TypeScript", "GPT-4o", "PostgreSQL", "Clerk", "Railway"].map((tech, i) => (
              <span key={tech} className="flex items-center">
                <span className="mx-2">·</span>
                <span className="text-muted-foreground">{tech}</span>
              </span>
            ))}
          </motion.div>

          {/* Mock incident card */}
          <motion.div
            className="max-w-2xl mx-auto text-left bg-card/80 border border-border/30 rounded-2xl p-8 shadow-[0_0_80px_rgba(59,130,246,0.1)]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="bg-red-500/15 text-red-400 text-xs font-semibold tracking-widest px-2.5 py-1 rounded" style={MONO}>
                  CRITICAL
                </span>
                <span className="bg-green-500/15 text-green-400 text-xs font-medium px-2.5 py-1 rounded">
                  AI Analysis Complete
                </span>
              </div>
              <span className="text-xs text-muted-foreground/50" style={MONO}>2 min ago</span>
            </div>

            <h3 className="text-foreground font-semibold text-xl mb-4">
              VPN Connection Failure — 47 Users Affected
            </h3>

            <div className="flex items-center gap-2 mb-6">
              {["Network", "INC-0047"].map((tag) => (
                <span key={tag} className="bg-secondary/30 text-muted-foreground text-xs px-2.5 py-1 rounded-md border border-border/50">
                  {tag}
                </span>
              ))}
              <span className="bg-red-500/10 text-red-400 text-xs font-medium px-2.5 py-1 rounded-md border border-red-500/20">
                Priority: Critical
              </span>
            </div>

            <div className="border-t border-border/30 mb-6" />

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1" style={MONO}>Category</div>
                <div className="text-sm text-foreground font-medium">Network</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-1" style={MONO}>Time Saved</div>
                <div className="text-sm text-green-400 font-medium">~18 min</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-4" style={MONO}>
              Recommended Actions
            </div>
            <div className="space-y-3 mb-6">
              {[
                "Check RADIUS server logs for authentication failures since 14:32 UTC",
                "Review VPN gateway logs for East Coast users",
                "Verify 802.1x authentication settings on affected endpoints",
                "Test DNS resolution for vpn.company.com",
                "Check firewall rules on pfsense-gw-01 for recent changes",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="text-primary font-bold text-xs mt-0.5 shrink-0" style={MONO}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border/30 pt-4">
              <span className="text-sm text-primary font-medium cursor-pointer hover:text-primary/80 transition">
                Draft Response Ready →
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features (Animated Cards) ────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.p
            className="text-muted-foreground text-sm uppercase tracking-widest mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Features
          </motion.p>
          <motion.h2
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Built for IT teams who actually
            <br />have to fix things
          </motion.h2>
          <motion.p
            className="text-muted-foreground max-w-xl mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            Built for IT teams who spend too much time triaging and not enough time fixing.
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-5 h-5" />,
                animation: <TriageAnimation />,
                title: "AI Triage in Seconds",
                desc: "GPT-4o classifies incidents, sets priority, and generates 8+ specific next steps referencing real tools.",
              },
              {
                icon: <Clock className="w-5 h-5" />,
                animation: <SpeedAnimation />,
                title: "Under 3 Second Analysis",
                desc: "From vague ticket to expert analysis with step-by-step runbook — faster than reading the ticket yourself.",
              },
              {
                icon: <Lock className="w-5 h-5" />,
                animation: <ShieldAnimation />,
                title: "Per-User Data Isolation",
                desc: "Every team's tickets are completely private. No shared data, no cross-contamination between accounts.",
              },
            ].map(({ animation, title, desc }, i) => (
              <motion.div
                key={title}
                className="bg-secondary/50 border border-border/30 rounded-xl p-8 min-h-[320px] flex flex-col hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 0.98 }}
              >
                <div className="flex-1 min-h-[160px]">{animation}</div>
                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Detailed feature rows */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                label: "RESPONSE",
                title: "Professional draft responses, ready to send",
                desc: "Every analysis includes a personalized draft response addressing the user by name, explaining what IT is doing, and asking the right clarifying questions.",
              },
              {
                label: "ROI",
                title: "Track time saved across your team",
                desc: "Sentri calculates time saved per ticket based on category and priority. Average: 12 minutes per incident. At 50 tickets a month, that's 10 hours back.",
              },
            ].map(({ label, title, desc }, i) => (
              <motion.div
                key={label}
                className="border border-border/30 rounded-xl p-8 bg-card/30"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-xs tracking-widest uppercase text-primary mb-3" style={MONO}>{label}</div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-gradient-to-b from-transparent to-card/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              How Sentri works
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Sign up, load your first incident, run AI analysis. No setup, no integrations, no IT degree required.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px border-t border-dashed border-border/50" />

            {[
              {
                n: "01",
                title: "Submit Your Ticket",
                desc: "Paste in any incident — a user complaint, an error log, or an alert. No special formatting needed.",
              },
              {
                n: "02",
                title: "AI Analyzes",
                desc: "GPT-4o classifies the category, sets priority, and writes 8–10 specific remediation steps referencing real tools like ADUC, Event Viewer, and M365 Admin Center.",
              },
              {
                n: "03",
                title: "Act on Insights",
                desc: "Get step-by-step remediation guidance and a draft reply ready to send.",
              },
            ].map(({ n, title, desc }, i) => (
              <motion.div
                key={n}
                className="relative text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="text-6xl font-black text-primary/20 mb-4" style={MONO}>
                  {n}
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-3">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (with Toggle) ────────────────────── */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Simple, transparent pricing
            </motion.h2>
            <motion.p
              className="text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Start free. Scale as your team grows.
            </motion.p>
            <PricingToggle frequency={frequency} setFrequency={setFrequency} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border overflow-hidden",
                  plan.highlighted
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/50 bg-card/50"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {plan.highlighted && <BorderTrail size={80} />}

                <div className={cn(
                  "p-8 border-b border-border/30",
                  plan.highlighted && "bg-primary/5"
                )}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.highlighted && (
                      <span className="flex items-center gap-1 bg-primary/20 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground/70 text-sm mb-4">{plan.info}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-black">${plan.price[frequency]}</span>
                    <span className="text-muted-foreground text-sm mb-1">
                      {plan.price[frequency] > 0
                        ? `/${frequency === "monthly" ? "mo" : "yr"}`
                        : "/mo"}
                    </span>
                  </div>
                  {frequency === "yearly" && plan.price.monthly > 0 && (
                    <p className="text-xs text-green-400 mt-1">
                      Save {Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100)}%
                    </p>
                  )}
                </div>

                <div className="p-8 flex-1">
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 pt-0">
                  <motion.button
                    onClick={() => openSignUp()}
                    className={cn(
                      "w-full rounded-xl py-3 text-sm font-semibold transition",
                      plan.highlighted
                        ? "bg-primary hover:bg-primary/80 text-primary-foreground"
                        : "border border-border/50 hover:border-border text-foreground/90"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground/70 text-center mt-6">
            No credit card required to start. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="py-12 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-bold">Sentri</span>
              </div>
              <p className="text-sm text-muted-foreground/70">
                AI-powered IT incident triage. Built for help desk teams.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/anthonyhastaba/Sentri"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
              >
                GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition">
                Terms
              </Link>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/50 text-center">
            &copy; {new Date().getFullYear()} Sentri. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
