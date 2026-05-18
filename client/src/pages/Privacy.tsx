import { Shield } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-semibold tracking-tight">Sentri</span>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Sentri</Link>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 2026</p>

        {/* Section 1 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Information We Collect</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          When you sign up for Sentri, we collect account information through Clerk, our authentication
          provider. This includes your email address, name, and any profile details you provide during
          sign-up. When you use Sentri to manage IT incidents, we collect the ticket data you submit —
          including titles, descriptions, priority levels, and status updates. We also collect standard
          usage analytics such as page views, feature interactions, and session duration to understand
          how the product is used and to improve it.
        </p>

        {/* Section 2 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">How We Use Your Information</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your data is used to provide and operate the Sentri service, including AI-powered incident
          triage, ticket management, and dashboard analytics. Ticket descriptions and metadata are sent
          to the OpenAI API to generate priority assessments and triage recommendations. We may use
          aggregated, anonymised usage data to improve our AI model accuracy and product features. We
          send transactional emails (such as account verification, password resets, and important
          service notices) via Clerk. We do not send marketing emails without your explicit consent.
        </p>

        {/* Section 3 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Data Isolation</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Each user's ticket data is strictly isolated by user ID. Sentri is designed so that no user
          can access another user's incidents, and we do not share ticket data between accounts under
          any circumstances. Access controls are enforced at the API layer on every request. Your
          incidents are your own, and we treat them accordingly.
        </p>

        {/* Section 4 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Third-Party Services</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Sentri relies on the following third-party providers to operate:
        </p>
        <ul className="text-muted-foreground text-sm leading-relaxed list-disc list-inside mt-2 space-y-1">
          <li>
            <span className="text-foreground/80 font-medium">Clerk</span> — handles authentication,
            user management, and session security.
          </li>
          <li>
            <span className="text-foreground/80 font-medium">OpenAI</span> — processes ticket
            descriptions to produce AI triage results. Ticket content is transmitted to OpenAI's
            API and subject to their data processing terms.
          </li>
          <li>
            <span className="text-foreground/80 font-medium">Neon</span> — provides the managed
            PostgreSQL database where your ticket data is stored.
          </li>
        </ul>
        <p className="text-muted-foreground text-sm leading-relaxed mt-3">
          Each provider operates under its own privacy policy. We encourage you to review them if
          you have concerns about how your data is processed by these services.
        </p>

        {/* Section 5 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Data Retention</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your ticket data is stored for as long as your Sentri account is active. You can delete
          individual tickets at any time from the dashboard. If you close your account, we will
          delete your associated data within 30 days, except where retention is required by law.
          We do not sell your data or retain it beyond what is necessary to provide the service.
        </p>

        {/* Section 6 */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Contact</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If you have any questions about this Privacy Policy or how your data is handled, please
          contact us at{" "}
          <a
            href="mailto:privacy@sentri.ai"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            privacy@sentri.ai
          </a>
          .
        </p>
      </div>
    </div>
  );
}
