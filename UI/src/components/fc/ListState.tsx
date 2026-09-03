import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ label = "Nothing to show yet." }: { label?: string }) {
  return <p className="py-16 text-center text-sm text-muted-foreground">{label}</p>;
}

export function LoadMoreButton({ onClick, label = "SHOW MORE" }: { onClick: () => void; label?: string }) {
  return (
    <div className="mt-5 flex justify-center">
      <Button variant="outlineGreen" size="lg" onClick={onClick}>
        {label}
      </Button>
    </div>
  );
}