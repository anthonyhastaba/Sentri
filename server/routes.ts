import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client using the environment variables from the integration
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.tickets.list.path, async (req, res) => {
    const tickets = await storage.getTickets();
    res.json(tickets);
  });

  app.get(api.tickets.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const ticket = await storage.getTicket(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  });

  app.post(api.tickets.create.path, async (req, res) => {
    try {
      const input = api.tickets.create.input.parse(req.body);
      const ticket = await storage.createTicket(input);
      
      // Auto-analyze immediately after creation if desired, or let client call analyze
      // For now, we just return the created ticket
      
      res.status(201).json(ticket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.tickets.update.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.tickets.update.input.parse(req.body);
      
      const existing = await storage.getTicket(id);
      if (!existing) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const updated = await storage.updateTicket(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.tickets.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getTicket(id);
    if (!existing) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    await storage.deleteTicket(id);
    res.status(204).send();
  });

  app.post(api.tickets.analyze.path, async (req, res) => {
    const id = Number(req.params.id);
    const ticket = await storage.getTicket(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    try {
      const prompt = `
        Analyze the following IT support ticket:
        Title: ${ticket.title}
        Content: ${ticket.content}

        Provide the following in JSON format:
        1. category (one of: Account Access, Malware/Security, Hardware, Network, Software, Other)
        2. priority (one of: Low, Medium, High, Critical)
        3. nextSteps (bullet points of ITIL/Security best practices)
        4. draftResponse (professional response to the user)
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are an expert IT security analyst and help desk specialist. Output valid JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const analysis = JSON.parse(content);
      
      // Update ticket with analysis results
      const updatedTicket = await storage.updateTicket(id, {
        category: analysis.category,
        priority: analysis.priority,
        nextSteps: analysis.nextSteps, // Ensure this handles array or string - storage expects string
        draftResponse: analysis.draftResponse,
        status: "in_progress" // Auto-update status to in_progress
      });

      // If nextSteps is an array, join it
      if (Array.isArray(analysis.nextSteps)) {
         await storage.updateTicket(id, { nextSteps: analysis.nextSteps.join('\n') });
         updatedTicket.nextSteps = analysis.nextSteps.join('\n');
      }

      res.json(updatedTicket);

    } catch (error) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ message: "Failed to analyze ticket" });
    }
  });

  // Seed data
  if ((await storage.getTickets()).length === 0) {
    await storage.createTicket({
      title: "Cannot login to VPN",
      content: "I keep getting 'Authentication Failed' when trying to connect to the corporate VPN. I reset my password yesterday.",
      status: "new"
    });
    
    await storage.createTicket({
      title: "Suspicious Email",
      content: "I received an email from 'IT Support' asking for my credentials. It looks fishy. The sender is support@gmaill.com.",
      status: "new"
    });
  }

  return httpServer;
}
