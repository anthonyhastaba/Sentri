import { tickets, type Ticket, type InsertTicket, type InternalInsertTicket } from "../shared/schema";
import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";

export interface PaginateOptions {
  limit?: number;
  offset?: number;
}

export interface IStorage {
  getTickets(userId: string, opts?: PaginateOptions): Promise<Ticket[]>;
  getTicket(id: number, userId: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket | InternalInsertTicket): Promise<Ticket>;
  updateTicket(id: number, userId: string, updates: Partial<InternalInsertTicket>): Promise<Ticket>;
  deleteTicket(id: number, userId: string): Promise<void>;
  deleteAllTickets(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTickets(userId: string, opts?: PaginateOptions): Promise<Ticket[]> {
    const base = db.select().from(tickets).where(eq(tickets.userId, userId)).orderBy(tickets.createdAt);
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

  async getTicket(id: number, userId: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(and(eq(tickets.id, id), eq(tickets.userId, userId)));
    return ticket;
  }

  async createTicket(insertTicket: InsertTicket | InternalInsertTicket): Promise<Ticket> {
    const userId = (insertTicket as InternalInsertTicket).userId;
    const [row] = await db
      .select({ max: sql<number>`max(${tickets.ticketNumber})` })
      .from(tickets)
      .where(eq(tickets.userId, userId));
    const nextNumber = (row?.max ?? 0) + 1;

    const [ticket] = await db
      .insert(tickets)
      .values({ ...(insertTicket as InternalInsertTicket), ticketNumber: nextNumber })
      .returning();
    return ticket;
  }

  async updateTicket(id: number, userId: string, updates: Partial<InternalInsertTicket>): Promise<Ticket> {
    const [updatedTicket] = await db
      .update(tickets)
      .set(updates)
      .where(and(eq(tickets.id, id), eq(tickets.userId, userId)))
      .returning();
    return updatedTicket;
  }

  async deleteTicket(id: number, userId: string): Promise<void> {
    await db.delete(tickets).where(and(eq(tickets.id, id), eq(tickets.userId, userId)));
  }

  async deleteAllTickets(userId: string): Promise<void> {
    await db.delete(tickets).where(eq(tickets.userId, userId));
  }
}

export const storage = new DatabaseStorage();
