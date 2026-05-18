import { SignInButton, SignUpButton, useAuth } from "@clerk/clerk-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">Sentri</h1>
        <p className="text-muted-foreground mt-2">Sign in to continue</p>
        <div className="flex gap-3">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
