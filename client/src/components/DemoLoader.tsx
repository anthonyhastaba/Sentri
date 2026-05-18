import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { Loader2, DatabaseZap } from "lucide-react";

const DEMO_INCIDENTS = [
  {
    title: "VPN keeps disconnecting — need fix before my 10am client call",
    content: `My VPN has been dropping every 30 minutes or so since I started work this morning. Getting some kind of gateway error when it drops but it reconnects on its own after a minute. Really need this stable before my client call at 10am — I'm fully remote today. I'm on the Dell laptop IT gave me last month. A few other people on my team are having the same issue.`,
  },
  {
    title: "Entire finance team can't access email — payroll due today",
    content: `None of us in finance can send or receive emails since around 11:30 this morning. Outlook shows Disconnected at the bottom and restarting hasn't helped. Tried logging into webmail and that's not working either. There are 8 of us affected and we have payroll that needs tut by end of day. This is urgent — please someone call me back at ext. 4521.`,
  },
  {
    title: "Locked out of account — didn't do it myself, possible unauthorized access",
    content: `I got locked out of my account this afternoon. When IT unlocked it I could see there were 5 failed login attempts around 2pm but I was in back-to-back meetings all afternoon and wasn't at my desk. I'm worried someone may have tried to access my account without permission. As Finance Director I have access to sensitive financial systems and shared drives. Please can someone investigate before just resetting my password. — Sarah Johnson`,
  },
  {
    title: "3rd floor printer offline, 20+ jobs stuck in queue — month end reports due today",
    content: `The HP printer near the accounting department has been showing offline since early this morning. Everyone on the floor is affected and there are at least 20 print jobs stuck in the queue. I tried turning it off and back on but it still shows offline on almputers. We really need to get our month end reports printed today. This same printer had issues last month too.`,
  },
  {
    title: "All 6 new hire laptops extremely slow — can't complete onboarding",
    content: `The 6 laptops given out to new starters this week are all running very slowly. Boot time is around 8-10 minutes and basic apps like Chrome and Word take a couple minutes to open. The new hires can't get through their onboarding tasks at this rate. Other laptops on the same floor are working fine so it seems specific to this batch. Let me know if you need the asset tag numbers.`,
  },
];

export function DemoLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const handleLoad = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast({ variant: "destructive", title: "Not signed in", description: "Please sign in and try again." });
        return;
      }
      const deleteRes = await fetch(api.tickets.deleteAll.path, {
        method: api.tickets.deleteAll.method,
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!deleteRes.ok) {
        toast({ variant: "destructive", title: "Failed to clear incidents", description: "Could not reset incidents. Please try again." });
        return;
      }
      for (const incident of DEMO_INCIDENTS) {
        await fetch(api.tickets.create.path, {
          method: api.tickets.create.method,
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(incident),
        });
      }
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      toast({ title: "Demo Loaded", description: "5 demo incidents loaded successfully." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load demo incidents." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLoad}
      disabled={isLoading}
      className="hidden md:inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-border bg-background hover:bg-primary/10 hover:text-primary h-10 px-4 py-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <DatabaseZap className="w-4 h-4 mr-2" />
      )}
      Load Demo Incidents
    </button>
  );
}
