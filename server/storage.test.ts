import { describe, it, expect, beforeEach } from "vitest";
import type { IStorage } from "./storage";
import type { InsertTicket, InternalInsertTicket, Ticket } from "../shared/schema";

/**
 * In-memory implementation of IStorage used for contract testing.
 * Any class that satisfies IStorage should behave the same way.
 */
class MockStorage implements IStorage {
  private store: Ticket[] = [];
  private nextId = 1;

  async getTickets(opts?: { limit?: number; offset?: number }): Promise<Ticket[]> {
    let result = [...this.store];
    if (opts?.offset !== undefined) result = result.slice(opts.offset);
    if (opts?.limit !== undefined) result = result.slice(0, opts.limit);
    return result;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.store.find((t) => t.id === id);
  }

  async createTicket(ticket: InsertTicket | InternalInsertTicket): Promise<Ticket> {
    const now = new Date();
    const newTicket: Ticket = {
      id: this.nextId++,
      title: ticket.title,
      content: ticket.content,
      category: null,
      priority: null,
      status: "new",
      nextSteps: null,
      draftResponse: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(newTicket);
    return newTicket;
  }

  async updateTicket(id: number, updates: Partial<InternalInsertTicket>): Promise<Ticket> {
    const idx = this.store.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Ticket ${id} not found`);
    this.store[idx] = { ...this.store[idx], ...updates };
    return this.store[idx];
  }

  async deleteTicket(id: number): Promise<void> {
    const idx = this.store.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Ticket ${id} not found`);
    this.store.splice(idx, 1);
  }
}

describe("IStorage contract", () => {
  let storage: IStorage;

  beforeEach(() => {
    storage = new MockStorage();
  });

  describe("getTickets", () => {
    it("returns an empty array when no tickets exist", async () => {
      expect(await storage.getTickets()).toHaveLength(0);
    });

    it("returns all tickets when no pagination options are given", async () => {
      await storage.createTicket({ title: "A", content: "a" });
      await storage.createTicket({ title: "B", content: "b" });
      await storage.createTicket({ title: "C", content: "c" });
      expect(await storage.getTickets()).toHaveLength(3);
    });

    it("respects limit", async () => {
      for (let i = 0; i < 5; i++) {
        await storage.createTicket({ title: `T${i}`, content: "c" });
      }
      const page = await storage.getTickets({ limit: 2 });
      expect(page).toHaveLength(2);
    });

    it("respects offset", async () => {
      await storage.createTicket({ title: "First", content: "c" });
      await storage.createTicket({ title: "Second", content: "c" });
      await storage.createTicket({ title: "Third", content: "c" });
      const page = await storage.getTickets({ offset: 1 });
      expect(page).toHaveLength(2);
      expect(page[0].title).toBe("Second");
    });

    it("respects limit and offset together", async () => {
      for (let i = 1; i <= 5; i++) {
        await storage.createTicket({ title: `T${i}`, content: "c" });
      }
      const page = await storage.getTickets({ limit: 2, offset: 2 });
      expect(page).toHaveLength(2);
      expect(page[0].title).toBe("T3");
    });
  });

  describe("getTicket", () => {
    it("returns the ticket by id", async () => {
      const created = await storage.createTicket({ title: "Lookup", content: "data" });
      const found = await storage.getTicket(created.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe("Lookup");
    });

    it("returns undefined for a missing id", async () => {
      expect(await storage.getTicket(9999)).toBeUndefined();
    });
  });

  describe("createTicket", () => {
    it("assigns a numeric id", async () => {
      const ticket = await storage.createTicket({ title: "New", content: "c" });
      expect(typeof ticket.id).toBe("number");
    });

    it("defaults status to 'new'", async () => {
      const ticket = await storage.createTicket({ title: "New", content: "c" });
      expect(ticket.status).toBe("new");
    });

    it("sets createdAt and updatedAt timestamps", async () => {
      const ticket = await storage.createTicket({ title: "New", content: "c" });
      expect(ticket.createdAt).toBeInstanceOf(Date);
      expect(ticket.updatedAt).toBeInstanceOf(Date);
    });

    it("leaves AI fields null until analyzed", async () => {
      const ticket = await storage.createTicket({ title: "New", content: "c" });
      expect(ticket.category).toBeNull();
      expect(ticket.priority).toBeNull();
      expect(ticket.nextSteps).toBeNull();
      expect(ticket.draftResponse).toBeNull();
    });
  });

  describe("updateTicket", () => {
    it("applies partial updates", async () => {
      const ticket = await storage.createTicket({ title: "Before", content: "c" });
      const updated = await storage.updateTicket(ticket.id, {
        status: "in_progress",
        category: "Network",
        priority: "High",
      });
      expect(updated.status).toBe("in_progress");
      expect(updated.category).toBe("Network");
      expect(updated.priority).toBe("High");
      expect(updated.title).toBe("Before"); // unchanged fields preserved
    });

    it("throws when the ticket does not exist", async () => {
      await expect(
        storage.updateTicket(9999, { status: "resolved" })
      ).rejects.toThrow();
    });
  });

  describe("deleteTicket", () => {
    it("removes the ticket from storage", async () => {
      const ticket = await storage.createTicket({ title: "Gone", content: "c" });
      await storage.deleteTicket(ticket.id);
      expect(await storage.getTickets()).toHaveLength(0);
      expect(await storage.getTicket(ticket.id)).toBeUndefined();
    });

    it("throws when the ticket does not exist", async () => {
      await expect(storage.deleteTicket(9999)).rejects.toThrow();
    });
  });
});
