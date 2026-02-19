import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateTicket } from "@/hooks/use-tickets";
import { insertTicketSchema, type InsertTicket } from "@shared/schema";
import { Sidebar } from "@/components/Sidebar";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "wouter";

export default function CreateTicket() {
  const [, setLocation] = useLocation();
  const { mutate, isPending } = useCreateTicket();

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  const onSubmit = (data: InsertTicket) => {
    mutate(data, {
      onSuccess: (newTicket) => {
        setLocation(`/tickets/${newTicket.id}`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 pt-14 md:pt-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">New Incident Ticket</h1>
            <p className="text-muted-foreground">Log a new security alert or IT support request for triage.</p>
          </header>

          <div className="glass-panel p-6 md:p-8 rounded-xl border border-border/50">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  Incident Title
                </label>
                <input
                  {...form.register("title")}
                  id="title"
                  className="flex h-12 w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g., Suspicious Login Attempt on Server 4"
                />
                {form.formState.errors.title && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
                  Description / Logs
                </label>
                <textarea
                  {...form.register("content")}
                  id="content"
                  rows={8}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-secondary/30 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Paste logs, user reports, or error messages here..."
                />
                {form.formState.errors.content && (
                  <p className="text-sm font-medium text-destructive">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-border/50">
                <Link href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 gap-2 shadow-lg shadow-primary/20"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Submit Ticket
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
