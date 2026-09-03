import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-3xl" : "text-xl";
  const icon = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  return (
    <Link to="/" className={cn("flex items-center gap-3", className)}>
      <svg viewBox="0 0 24 24" className={cn(icon, "text-primary")} fill="currentColor" aria-hidden>
        <circle cx="16.5" cy="3.6" r="2.1" />
        <path d="M14.9 7.2 9.7 9.9l-2.9 4.4-2 5.9 2.1.7 1.8-5.3 2.6-2.2.6 4.3-2.6 5.4 2 1 3.1-6.3-.4-5.1 3.1-1.5 2.9 3.1 1.5-1.4-3.6-4.1z" />
        <rect x="2.5" y="1.5" width="1.6" height="9" rx="0.8" transform="rotate(-24 3.3 6)" />
      </svg>
      <span className={cn("font-display font-extrabold leading-[0.95] tracking-tight", text)}>
        <span className="block text-foreground">FANTASY</span>
        <span className="block text-primary">CRICKET</span>
      </span>
    </Link>
  );
}
