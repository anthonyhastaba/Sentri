import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import type express from "express";
import type { Ticket } from "../shared/schema";

// Prevent dotenv from loading .env so env-var checks are deterministic in tests.
vi.mock("dotenv/config", () => ({}));

// Prevent server/db.ts from throwing due to missing DATABASE_URL
vi.mock("./db", () => ({ pool: {}, db: {} }));

const mockTicket: Ticket = {
  id: 1,
  title: "Active Directory Account Lockout",
  content: "User jdoe cannot log in — account is locked.",
  category: null,
  priority: null,
  status: "new",
  nextSteps: null,
  draftResponse: null,
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
};

const analyzedTicket: Ticket = {
  ...mockTicket,
  category: "Account Access",
  priority: "High",
  status: "in_progress",
  nextSteps: "1. Check ADUC for lockout source\n2. Review Event ID 4740",
  draftResponse: "Hi, we are investigating your account lockout...",
};

// Variable names starting with "mock" are hoisted by Vitest so they can be
// referenced inside the vi.mock() factory without TDZ errors.
const mockStorage = {
  getTickets: vi.fn(),
  getTicket: vi.fn(),
  createTicket: vi.fn(),
  updateTicket: vi.fn(),
  deleteTicket: vi.fn(),
};

vi.mock("./storage", () => ({ storage: mockStorage }));

describe("Tickets API", () => {
  let app: express.Express;

  beforeAll(async () => {
    // Clear any real API keys so openai = null inside routes.ts, preventing real API calls.
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

    // Seed check inside registerRoutes: return non-empty so seeding is skipped.
    mockStorage.getTickets.mockResolvedValue([mockTicket]);
    mockStorage.createTicket.mockResolvedValue(mockTicket);

    const { createApp } = await import("./app");
    app = await createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getTickets.mockResolvedValue([mockTicket]);
    mockStorage.getTicket.mockResolvedValue(mockTicket);
    mockStorage.createTicket.mockResolvedValue(mockTicket);
    mockStorage.updateTicket.mockResolvedValue(mockTicket);
    mockStorage.deleteTicket.mockResolvedValue(undefined);
  });

  // ── GET /api/tickets ──────────────────────────────────────────────────────

  describe("GET /api/tickets", () => {
    it("returns 200 with an array of tickets", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].id).toBe(1);
    });

    it("forwards limit and offset query params to storage", async () => {
      mockStorage.getTickets.mockResolvedValue([]);
      await request(app).get("/api/tickets?limit=5&offset=10");
      expect(mockStorage.getTickets).toHaveBeenCalledWith({ limit: 5, offset: 10 });
    });

    it("passes undefined when no pagination params are given", async () => {
      await request(app).get("/api/tickets");
      expect(mockStorage.getTickets).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
      });
    });
  });

  // ── GET /api/tickets/:id ──────────────────────────────────────────────────

  describe("GET /api/tickets/:id", () => {
    it("returns 200 with the ticket", async () => {
      const res = await request(app).get("/api/tickets/1");
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
    });

    it("returns 404 when the ticket does not exist", async () => {
      mockStorage.getTicket.mockResolvedValue(undefined);
      const res = await request(app).get("/api/tickets/9999");
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Ticket not found");
    });
  });

  // ── POST /api/tickets ─────────────────────────────────────────────────────

  describe("POST /api/tickets", () => {
    it("returns 201 with the created ticket", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({ title: "VPN Down", content: "Cannot reach VPN gateway." });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(1);
      expect(mockStorage.createTicket).toHaveBeenCalledOnce();
    });

    it("returns 400 when title is missing", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({ content: "No title provided." });
      expect(res.status).toBe(400);
    });

    it("returns 400 when content is missing", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .send({ title: "Missing content" });
      expect(res.status).toBe(400);
    });
  });

  // ── PUT /api/tickets/:id ──────────────────────────────────────────────────

  describe("PUT /api/tickets/:id", () => {
    it("returns 200 with the updated ticket", async () => {
      mockStorage.updateTicket.mockResolvedValue({ ...mockTicket, status: "resolved" });
      const res = await request(app)
        .put("/api/tickets/1")
        .send({ status: "resolved" });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("resolved");
    });

    it("returns 404 when the ticket does not exist", async () => {
      mockStorage.getTicket.mockResolvedValue(undefined);
      const res = await request(app)
        .put("/api/tickets/9999")
        .send({ status: "resolved" });
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /api/tickets/:id ───────────────────────────────────────────────

  describe("DELETE /api/tickets/:id", () => {
    it("returns 204 on success", async () => {
      const res = await request(app).delete("/api/tickets/1");
      expect(res.status).toBe(204);
      expect(mockStorage.deleteTicket).toHaveBeenCalledWith(1);
    });

    it("returns 404 when the ticket does not exist", async () => {
      mockStorage.getTicket.mockResolvedValue(undefined);
      const res = await request(app).delete("/api/tickets/9999");
      expect(res.status).toBe(404);
    });
  });

  // ── POST /api/tickets/:id/analyze ─────────────────────────────────────────

  describe("POST /api/tickets/:id/analyze", () => {
    it("returns 404 when the ticket does not exist", async () => {
      mockStorage.getTicket.mockResolvedValue(undefined);
      const res = await request(app).post("/api/tickets/9999/analyze");
      expect(res.status).toBe(404);
    });

    it("returns 503 when the OpenAI key is not configured", async () => {
      // In the test environment OPENAI_API_KEY is not set, so openai = null
      const res = await request(app).post("/api/tickets/1/analyze");
      expect(res.status).toBe(503);
      expect(res.body.message).toMatch(/not configured/i);
    });
  });

  // ── POST /api/tickets/bulk-analyze ────────────────────────────────────────

  describe("POST /api/tickets/bulk-analyze", () => {
    it("returns 503 when the OpenAI key is not configured", async () => {
      const res = await request(app)
        .post("/api/tickets/bulk-analyze")
        .send({ ids: [1, 2] });
      expect(res.status).toBe(503);
    });

    it("returns 503 for all requests when the OpenAI key is not configured", async () => {
      // The openai null-check in the route fires before Zod validation, so even
      // an invalid body receives 503 (not 400) when no key is present.
      const res = await request(app)
        .post("/api/tickets/bulk-analyze")
        .send({ ids: "not-an-array" });
      expect(res.status).toBe(503);
    });
  });
});
