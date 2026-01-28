import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "../shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { batchProcess } from "./replit_integrations/batch";

const openaiKey = (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "").trim();
const openai = openaiKey
  ? new OpenAI({
      apiKey: openaiKey,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    })
  : null;
if (process.env.NODE_ENV === "production") {
  console.log("[openai]", openai ? "API key configured" : "No API key (set OPENAI_API_KEY in Railway Variables)");
}

const TICKET_ANALYSIS_SYSTEM_PROMPT = `You are a senior IT security engineer and ITIL-certified help desk specialist at a large enterprise organization. You have 10+ years of experience handling security incidents, account management, network issues, and endpoint security.
For nextSteps: Always provide exactly 8-10 highly specific numbered steps. Reference real enterprise tools by name based on incident type:
- Account Access: ADUC, Event ID 4740, Windows Credential Manager, ALTools, password policy
- Malware/Security: Windows Defender, Microsoft 365 Defender, endpoint isolation, chain of custody, quarantine procedures
- Network: network adapter settings, DNS configuration, 802.1x authentication, RADIUS, eduroam
- Hardware: device management console, warranty lookup, imaging procedures, hardware diagnostics
- Authentication: MFA admin portal, Azure AD, conditional access policies
For draftResponse: Write a detailed professional email that addresses the user by name, explains exactly what IT will investigate, asks 3-4 specific technical clarifying questions, outlines immediate steps being taken, and signs off as IT Support Team.
Keep JSON format identical.`;

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
    if (!openai) {
      return res.status(503).json({ message: "AI analysis is not configured. Set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY in .env." });
    }

    try {
      const prompt = `Analyze this IT support ticket and return JSON only.

Title: ${ticket.title}

Content: ${ticket.content}

Provide:
1. category (one of: Account Access, Malware/Security, Hardware, Network, Software, Other)
2. priority (one of: Low, Medium, High, Critical)
3. nextSteps: 8–10 numbered, highly specific steps tailored to this incident type. Reference enterprise tools by name where relevant (e.g. ADUC, Event ID 4740, Microsoft 365 Admin Center, Exchange Admin Center).
4. draftResponse: A professional draft that addresses the user by name when inferable from the content; explains exactly what IT will do; includes 1–3 specific clarifying questions for this incident type; and ends with a professional sign-off.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: TICKET_ANALYSIS_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
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

    } catch (error: unknown) {
      console.error("AI Analysis failed:", error);
      const message = error instanceof Error ? error.message : "Failed to analyze ticket";
      res.status(500).json({ message });
    }
  });

  app.post(api.tickets.bulkAnalyze.path, async (req, res) => {
    if (!openai) {
      return res.status(503).json({ message: "AI analysis is not configured. Set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY in .env." });
    }
    try {
      const { ids } = api.tickets.bulkAnalyze.input.parse(req.body);
      
      const results = await batchProcess(
        ids,
        async (id) => {
          const ticket = await storage.getTicket(id);
          if (!ticket) return null;

          const prompt = `Analyze this IT support ticket and return JSON only.

Title: ${ticket.title}

Content: ${ticket.content}

Provide:
1. category (one of: Account Access, Malware/Security, Hardware, Network, Software, Other)
2. priority (one of: Low, Medium, High, Critical)
3. nextSteps: 8–10 numbered, highly specific steps tailored to this incident type. Reference enterprise tools by name where relevant (e.g. ADUC, Event ID 4740, Microsoft 365 Admin Center, Exchange Admin Center).
4. draftResponse: A professional draft that addresses the user by name when inferable from the content; explains exactly what IT will do; includes 1–3 specific clarifying questions for this incident type; and ends with a professional sign-off.`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: TICKET_ANALYSIS_SYSTEM_PROMPT },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            max_tokens: 2000,
          });

          const content = response.choices[0].message.content;
          if (!content) throw new Error("No response from AI");

          const analysis = JSON.parse(content);
          
          let nextStepsStr = Array.isArray(analysis.nextSteps) 
            ? analysis.nextSteps.join('\n') 
            : analysis.nextSteps;

          return await storage.updateTicket(id, {
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
      console.error("Bulk Analysis failed:", err);
      res.status(500).json({ message: "Bulk analysis failed" });
    }
  });

  // Seed data
  if ((await storage.getTickets()).length === 0) {
    const seedTickets = [
      {
        title: "Active Directory Account Lockout",
        content: "User 'jdoe' reports they are unable to log in to their workstation. Error message indicates the account is locked. This is the third time this week for this user.",
        status: "new"
      },
      {
        title: "Suspicious Email - Possible Phishing",
        content: "Received a report of an email appearing to be from 'CEO Payroll' asking employees to verify their bank details via a non-corporate link: 'http://corp-payroll-verify.net'.",
        status: "new"
      },
      {
        title: "Laptop Cannot Connect to Eduroam",
        content: "Student laptop (macOS) fails to authenticate with Eduroam. Works on guest network but Eduroam stuck on 'Connecting...'. Certificate was recently updated.",
        status: "new"
      },
      {
        title: "Zoom Rooms Display Not Responding",
        content: "Conference Room 4B: The main display is black and the tablet controller shows 'Unable to connect to Zoom Room'. Power cycle did not resolve.",
        status: "new"
      },
      {
        title: "Possible Malware Detected on Managed Device",
        content: "EDR alert triggered on 'WKSTN-882'. Multiple unauthorized outbound connections detected to known malicious IP addresses. Unusual process activity in /tmp.",
        status: "new"
      },
      {
        title: "MFA Reset Request",
        content: "Employee lost their mobile device while traveling and needs their Okta MFA tokens reset to set up a new device. Verified identity via manager.",
        status: "new"
      },
      {
        title: "VPN Authentication Failure",
        content: "Several users in the EMEA region reporting 'Gateway Timeout' when attempting to connect to the London VPN concentrator. Possible ISP routing issue.",
        status: "new"
      }
    ];

    for (const ticket of seedTickets) {
      await storage.createTicket(ticket);
    }
  }

  return httpServer;
}
