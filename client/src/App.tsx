import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import CreateTicket from "@/pages/CreateTicket";
import TicketDetail from "@/pages/TicketDetail";
import LandingPage from "@/pages/LandingPage";
import Analytics from "@/pages/Analytics";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import AuthGuard from "@/components/auth/AuthGuard";
import { WelcomeModal } from "@/components/WelcomeModal";
import { useAuth } from "@clerk/clerk-react";

function RootRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <LandingPage />;
  }

  return (
    <>
      <WelcomeModal />
      <Dashboard />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={RootRoute} />
      <Route path="/tickets/new">
        <AuthGuard><CreateTicket /></AuthGuard>
      </Route>
      <Route path="/tickets/:id">
        <AuthGuard><TicketDetail /></AuthGuard>
      </Route>
      <Route path="/analytics">
        <AuthGuard><Analytics /></AuthGuard>
      </Route>
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
