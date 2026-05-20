import { ClerkProvider } from "@clerk/clerk-react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

declare global {
  interface Window {
    __CLERK_PUBLISHABLE_KEY__?: string;
  }
}

function getClerkPublishableKey(): string {
  const runtime = window.__CLERK_PUBLISHABLE_KEY__?.trim();
  const fromEnv = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
  return runtime || fromEnv || "";
}

const publishableKey = getClerkPublishableKey();

if (!publishableKey) {
  createRoot(document.getElementById("root")!).render(
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-muted-foreground">
      <p>
        Clerk is not configured. Set{" "}
        <code className="rounded bg-muted px-1">CLERK_PUBLISHABLE_KEY</code> in your
        deployment environment.
      </p>
    </div>,
  );
} else {
  createRoot(document.getElementById("root")!).render(
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>,
  );
}
