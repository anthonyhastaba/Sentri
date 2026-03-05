import { tickets, type Ticket, type InsertTicket, type InternalInsertTicket } from "../shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface PaginateOptions {
  limit?: number;
  offset?: number;
}

export interface IStorage {
  getTickets(opts?: PaginateOptions): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket | InternalInsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<InternalInsertTicket>): Promise<Ticket>;
  deleteTicket(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTickets(opts?: PaginateOptions): Promise<Ticket[]> {
    const base = db.select().from(tickets).orderBy(tickets.createdAt);
    if (opts?.limit !== undefined && opts?.offset !== undefined) {
      return await base.limit(opts.limit).offset(opts.offset);
    }
    if (opts?.limit !== undefined) {
      return await base.limit(opts.limit);
    }
    if (opts?.offset !== undefined) {
      return await base.offset(opts.offset);
    }
    return await base;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async createTicket(insertTicket: InsertTicket | InternalInsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values(insertTicket as InternalInsertTicket)
      .returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<InternalInsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set(updates)
      .where(eq(tickets.id, id))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<void> {
    await db.delete(tickets).where(eq(tickets.id, id));
  }
}

export const storage = new DatabaseStorage();
