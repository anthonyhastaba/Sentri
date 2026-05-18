import type { Express } from "express";
import { createServer, type Server } from "http";
import { getAuth } from "@clerk/express";
import { storage } from "./storage";
import { requireAuth } from "./app";
import { api } from "../shared/routes";
import { tickets } from "../shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { batchProcess } from "./lib/batch";

const openaiKey = (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "").trim();
const openai = openaiKey
  ? new OpenAI({
      apiKey: openaiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;

const TICKET_ANALYSIS_SYSTEM_PROMPT = `You are a Senior IT Operations Engineer with 14 years of enterprise IT experience. You hold ITIL v4, CompTIA Security+, and Microsoft 365 certifications.
You respond with valid JSON only. No markdown, no explanation, no preamble. Raw JSON only.

PRIORITY RULES:
- critical: 10+ users affected OR business-critical system completely down (email, VPN for whole team, financial systems, payroll) OR security incident with potential unauthorized access
- high: 5-9 users affected OR single user completely blocked from their job OR account security concern OR executive affected
- medium: 1-4 users affected OR degraded performance OR workaround available
- low: single user, minor inconvenience, user can still work

CATEGORY RULES:
- Network: VPN, WiFi, connectivity, firewall, DNS
- Email: Outlook, M365 mail, Exchange, calendar
- Account Access: lockouts, password resets, MFA, SSO, Active Directory
- Hardware: laptops, desktops, printers, monitors
- Software: application crashes, installations, licensing, performance
- Security: unauthorized access, phishing, malware, suspicious activity
- Other: anything else

NEXT STEPS — exactly 8 steps as a JSON array:
- Every step starts with an action verb: Check, Open, Review, Navigate, Run, Verify, Inspect, Restart, Export, Disable, Enable, Test, Contact
- Every step is specific and immediately actionable
- Reference real enterprise tools by name:
  * Network/VPN: RADIUS server logs, VPN gateway logs, 802.1x settings, DNS config, network adapter settings, ping/tracert, Cisco AnyConnect logs
  * Email/M365: Exchange Admin Center, M365 Admin Center service health, mail flow rules, MX records, Outlook profile, conditional access policies
  * Account/Lockout: ADUC, Event ID 4740 in Event Viewer on the domain controller, Azure AD sign-in logs, MFA status in Azure AD portal, Windows Credential Manager
  * Hardware: Device Manager, hardware diagnostics, print spooler service, printer IP config, startup programs via msconfig, Task Manager
  * Security: Azure AD risky sign-ins report, Microsoft Defender Security Center, audit recent file access logs, check concurrent sessions, preserve logs for chain of custody
- Reference specific details from the ticket where possible (names, times, departments, error messages)
- Steps in logical order: gather info → diagnose → remediate → communicate
- Step 8 must always be a communication step: notify the user, their manager, or update the ticket

DRAFT RESPONSE — max 150 words:
- If a name is in the ticket: "Hi [Name],"
- If no name but department known: "Hi [Dept] team,"
- If no individual name is given but a department is mentioned (finance, accounting, IT, sales, HR, engineering, marketing, legal), always address as "Hi [Department] team," — for example "Hi Finance team,"
- Paragraph 1: Acknowledge the specific issue, mention system affected and number of users, confirm you are already investigating
- Paragraph 1 must ALWAYS start with what the user is experiencing — never start with what IT is doing. The first sentence must describe the reported problem. Correct: "We've received your report that the entire finance team cannot access email, affecting 8 users at a critical time with payroll due today. We are treating this as priority and actively investigating." Wrong: "We are checking the M365 Admin Center..."
- Paragraph 2: Name exactly 2 specific actions IT is taking right now, reference real tools
- Ask exactly 2 specific technical clarifying questions numbered 1. and 2.
- Sign off: "Best regards,\\nIT Support Team"
- Never use: "Hello Team", "I hope this finds you well", "please don't hesitate", "at your earliest convenience", "Thank you for your patience"
- Sound like a real engineer, not a customer service bot

TIME SAVED:
- Network: 18 min, Email: 21 min, Account Access: 14 min, Hardware: 12 min, Software: 15 min, Security: 25 min, Other: 10 min
- Add 5 if critical, add 3 if high
- Return as integer in timeSaved field

RETURN THIS EXACT JSON:
{
  "category": "Network",
  "priority": "critical",
  "nextSteps": ["step 1", "step 2", "step 3", "step 4", "step 5", "step 6", "step 7", "step 8"],
  "draftResponse": "Hi [Name],\\n\\n...\\n\\nBest regards,\\nIT Support Team",
  "timeSaved": 23
}`;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get(api.tickets.list.path, requireAuth, async (req, res) => {
    const { userId } = getAuth(req);
    const limit = req.query.limit !== undefined ? Math.min(parseInt(req.query.limit as string) || 50, 100) : undefined;
    const offset = req.query.offset !== undefined ? Number(req.query.offset) : undefined;
    const tickets = await storage.getTickets(userId!, { limit, offset });
    res.json(tickets);
  });

  app.get(api.tickets.get.path, requireAuth, async (req, res) => {
    const { userId } = getAuth(req);
    const id = Number(req.params.id);
    const ticket = await storage.getTicket(id, userId!);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    res.json(ticket);
  });

  app.post(api.tickets.create.path, requireAuth, async (req, res) => {
    try {
      const { userId } = getAuth(req);
      const input = api.tickets.create.input.parse(req.body);
      const ticket = await storage.createTicket({ ...input, userId: userId! });

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

  app.put(api.tickets.update.path, requireAuth, async (req, res) => {
    try {
      const { userId } = getAuth(req);
      const id = Number(req.params.id);
      const input = api.tickets.update.input.parse(req.body);

      const existing = await storage.getTicket(id, userId!);
      if (!existing) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      const updated = await storage.updateTicket(id, userId!, input);
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

  app.delete(api.tickets.deleteAll.path, requireAuth, async (req, res) => {
    try {
      const { userId } = getAuth(req);
      await storage.deleteAllTickets(userId!);
      res.status(204).send();
    } catch (error) {
      console.error("Delete all tickets failed:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ error: "Failed to delete tickets" });
    }
  });

  app.delete(api.tickets.delete.path, requireAuth, async (req, res) => {
    const { userId } = getAuth(req);
    const id = Number(req.params.id);
    const existing = await storage.getTicket(id, userId!);
    if (!existing) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    await storage.deleteTicket(id, userId!);
    res.status(204).send();
  });

  app.post(api.tickets.analyze.path, requireAuth, async (req, res) => {
    const { userId } = getAuth(req);
    const id = Number(req.params.id);
    const ticket = await storage.getTicket(id, userId!);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    const accessKey = req.body.accessKey ?? req.headers['x-access-key'];
    if (accessKey !== "DEMO123") {
      return res.status(403).json({
        error: "Access key required",
        message: "Enter access key DEMO123 to unlock AI analysis",
      });
    }
    if (!openai) {
      return res.status(503).json({ message: "AI analysis is not configured. Set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY in .env." });
    }

    try {
      const prompt = `Analyze this IT support ticket submitted by a non-technical employee. Apply all rules exactly.
Return JSON only.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.content}

Apply priority rules based on business impact.
Reference specific details from this ticket in your next steps and draft response.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: TICKET_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      let analysis: { category: string; priority: string; nextSteps: string | string[]; draftResponse: string };
      try {
        analysis = JSON.parse(content);
      } catch {
        return res.status(500).json({ message: "Analysis failed. Please try again." });
      }

      const nextSteps = Array.isArray(analysis.nextSteps)
        ? analysis.nextSteps.join('\n')
        : analysis.nextSteps;

      const updatedTicket = await storage.updateTicket(id, userId!, {
        category: analysis.category,
        priority: analysis.priority,
        nextSteps,
        draftResponse: analysis.draftResponse,
        status: "in_progress",
      });

      res.json(updatedTicket);

    } catch (error: unknown) {
      console.error("AI analysis failed:", error instanceof Error ? error.message : String(error));
      res.status(500).json({ message: "Analysis failed. Please try again." });
    }
  });

  app.post(api.tickets.bulkAnalyze.path, requireAuth, async (req, res) => {
    const { userId } = getAuth(req);
    const accessKey = req.body.accessKey ?? req.headers['x-access-key'];
    if (accessKey !== "DEMO123") {
      return res.status(403).json({
        error: "Access key required",
        message: "Enter access key DEMO123 to unlock AI analysis",
      });
    }
    if (!openai) {
      return res.status(503).json({ message: "AI analysis is not configured. Set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY in .env." });
    }
    try {
      const { ids } = api.tickets.bulkAnalyze.input.parse(req.body);

      const results = await batchProcess(
        ids,
        async (id) => {
          const ticket = await storage.getTicket(id, userId!);
          if (!ticket) return null;

          const prompt = `Analyze this IT support ticket submitted by a non-technical employee. Apply all rules exactly.
Return JSON only.

Ticket Title: ${ticket.title}
Ticket Description: ${ticket.content}

Apply priority rules based on business impact.
Reference specific details from this ticket in your next steps and draft response.`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: TICKET_ANALYSIS_SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 1500,
          });

          const content = response.choices[0].message.content;
          if (!content) throw new Error("No response from AI");

          let analysis: { category: string; priority: string; nextSteps: string | string[]; draftResponse: string };
          try {
            analysis = JSON.parse(content);
          } catch {
            return null;
          }

          let nextStepsStr = Array.isArray(analysis.nextSteps)
            ? analysis.nextSteps.join('\n') 
            : analysis.nextSteps;

          return await storage.updateTicket(id, userId!, {
            category: analysis.category,
            priority: analysis.priority,
            nextSteps: nextStepsStr,
            draftResponse: analysis.draftResponse,
            status: "in_progress"
          });
        },
        { concurrency: 3 }
      );

      const successfulResults = results.filter((r): r is NonNullable<typeof r> => r !== null);
      
      const calculateTimeSaved = (ticket: any) => {
        if (!ticket.priority) return 0;
        let base = 0;
        const p = ticket.priority.toLowerCase();
        if (p === 'critical') base = 18;
        else if (p === 'high') base = 15;
        else if (p === 'medium') base = 10;
        else if (p === 'low') base = 6;
        if (ticket.category === 'Malware/Security') base += 3;
        return base;
      };

      const totalTimeSaved = successfulResults.reduce((acc, r) => acc + calculateTimeSaved(r), 0);

      res.json({
        count: successfulResults.length,
        totalTimeSaved,
        results: successfulResults
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid IDs" });
      }
      console.error("Bulk analysis failed:", err instanceof Error ? err.message : String(err));
      res.status(500).json({ message: "Bulk analysis failed" });
    }
  });

  return httpServer;
}
