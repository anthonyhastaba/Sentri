import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Creates the Express app with API routes and error handler (no static serving, no listen).
 * Used by server/index.ts for local/production server and by api/[[...path]].ts for Vercel.
 */
export async function createApp(): Promise<express.Express> {
  const app = express();
  const _httpServer = createServer(app);

  // Vercel can pass path without /api prefix; ensure Express sees /api/...
  app.use((req, _res, next) => {
    const url = req.url || "/";
    if (!url.startsWith("/api")) {
      (req as { url?: string }).url = "/api" + (url.startsWith("/") ? url : "/" + url);
    }
    next();
  });

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: unknown }).rawBody = buf;
      },
    }),
  );
  app.use(express.urlencoded({ extended: false }));

  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = function (bodyJson: unknown) {
      capturedJsonResponse = bodyJson as Record<string, unknown>;
      return originalResJson(bodyJson);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        log(logLine);
      }
    });

    next();
  });

  await registerRoutes(_httpServer, app);

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const status = (err as { status?: number; statusCode?: number }).status
      ?? (err as { status?: number; statusCode?: number }).statusCode
      ?? 500;
    const message = (err as Error).message ?? "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  return app;
}
