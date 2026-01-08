/**
 * Minimal health check - no DB, no Express. Use to verify Vercel is running the API.
 * Visit: https://your-app.vercel.app/api/health
 * Vercel uses the Web Request/Response API.
 */
export function GET(_request: Request) {
  return Response.json({ ok: true }, { status: 200 });
}
