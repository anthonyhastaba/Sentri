import { pgTable, text, serial, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  priority: text("priority"),
  status: text("status").notNull().default("new"), // new, in_progress, resolved
  nextSteps: text("next_steps"),
  draftResponse: text("draft_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdateFn(() => new Date()),
}, (t) => [
  index("tickets_status_idx").on(t.status),
  index("tickets_created_at_idx").on(t.createdAt),
]);

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  category: true,
  priority: true,
  status: true,
  nextSteps: true,
  draftResponse: true
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InternalInsertTicket = typeof tickets.$inferInsert;
