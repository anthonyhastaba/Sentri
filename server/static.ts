import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // In production the bundle runs as dist/index.cjs; static files live in dist/public.
  // Use cwd so it works when run from project root (e.g. Railway).
  const distPath =
    process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "public")
      : path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  console.log("[static] serving from", distPath);

  app.use(express.static(distPath));

  // SPA fallback: serve index.html for any non-file route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
