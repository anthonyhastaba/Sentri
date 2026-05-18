import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { api, buildUrl } from "@shared/routes";
import type { InsertTicket, Ticket } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useTickets() {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [api.tickets.list.path],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(api.tickets.list.path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof data?.message === "string" ? data.message : "Failed to fetch tickets";
        throw new Error(msg);
      }
      return api.tickets.list.responses[200].parse(data);
    },
  });
}

export function useTicket(id: number) {
  const { getToken } = useAuth();
  return useQuery({
    queryKey: [api.tickets.get.path, id],
    queryFn: async () => {
      const token = await getToken();
      const url = buildUrl(api.tickets.get.path, { id });
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch ticket");
      const data = await res.json();
      return api.tickets.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newTicket: InsertTicket) => {
      const token = await getToken();
      const validated = api.tickets.create.input.parse(newTicket);
      const res = await fetch(api.tickets.create.path, {
        method: api.tickets.create.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = await res.json();
          throw new Error(error.message || "Validation failed");
        }
        throw new Error("Failed to create ticket");
      }

      const data = await res.json();
      return api.tickets.create.responses[201].parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      toast({ title: "Ticket Created", description: "New incident ticket has been logged." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<Omit<Ticket, 'id' | 'createdAt'>>) => {
      const token = await getToken();
      const url = buildUrl(api.tickets.update.path, { id });
      const res = await fetch(url, {
        method: api.tickets.update.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update ticket");
      const data = await res.json();
      return api.tickets.update.responses[200].parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tickets.get.path, data.id] });
      toast({ title: "Ticket Updated", description: "Changes saved successfully." });
    },
  });
}

export function useAnalyzeTicket() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, accessKey }: { id: number; accessKey: string }) => {
      const token = await getToken();
      const url = buildUrl(api.tickets.analyze.path, { id });
      const res = await fetch(url, {
        method: api.tickets.analyze.method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data && typeof data.message === "string") ? data.message : "Analysis failed";
        throw new Error(msg);
      }
      return api.tickets.analyze.responses[200].parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tickets.get.path, data.id] });
      toast({ title: "Analysis Complete", description: "AI has categorized and prioritized the ticket." });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Could not complete AI analysis.";
      toast({ variant: "destructive", title: "Analysis Failed", description: message });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      const url = buildUrl(api.tickets.delete.path, { id });
      const res = await fetch(url, {
        method: api.tickets.delete.method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete ticket");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tickets.list.path] });
      toast({ title: "Ticket Deleted", description: "Record removed from database." });
    },
  });
}
