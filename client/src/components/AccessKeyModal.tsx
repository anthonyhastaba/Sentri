import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";

interface AccessKeyModalProps {
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export function AccessKeyModal({ open, onSuccess, onClose }: AccessKeyModalProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim() === "DEMO123") {
      localStorage.setItem("sentri_access_key", "DEMO123");
      setKey("");
      setError("");
      onSuccess();
    } else {
      setError("Invalid access key");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setKey("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Unlock AI Analysis
          </DialogTitle>
          <DialogDescription>
            Enter your access key to enable GPT-4o triage
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Input
              placeholder="Enter access key..."
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError("");
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">Your access key was provided when you signed up. Contact support if you need help.</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!key.trim()}>
              Unlock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
