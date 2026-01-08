/**
 * Vercel serverless: export the Express app so Vercel invokes it with Node (req, res).
 * Path normalization for /api is done in server/app.ts middleware.
 */
import { createApp } from "../server/app";

const app = await createApp();
export default app;
