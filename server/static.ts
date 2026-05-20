import express, { type Express } from "express";
import fs from "fs";
import path from "path";

function clerkPublishableKey(): string {
  return (
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    ""
  ).trim();
}

function buildIndexHtml(distPath: string): string {
  const raw = fs.readFileSync(path.join(distPath, "index.html"), "utf-8");
  const key = clerkPublishableKey();
  const injection = `<script>window.__CLERK_PUBLISHABLE_KEY__=${JSON.stringify(key)}</script>`;
  if (raw.includes("</head>")) {
    return raw.replace("</head>", `${injection}</head>`);
  }
  return `${injection}${raw}`;
}

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

  const indexHtml = buildIndexHtml(distPath);
  const key = clerkPublishableKey();
  if (!key) {
    console.warn(
      "[clerk] No publishable key at runtime. Set CLERK_PUBLISHABLE_KEY or VITE_CLERK_PUBLISHABLE_KEY in Railway variables.",
    );
  }

  // Do not auto-serve index.html — we inject Clerk config into it on every SPA route.
  app.use(express.static(distPath, { index: false }));

  // SPA fallback: serve index.html for any non-file route (Express 5 requires named wildcard)
  app.get("/{*path}", (_req, res) => {
    res.type("html").send(indexHtml);
  });
}
