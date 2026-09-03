import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function Field({
  label,
  icon,
  type = "text",
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode }) {
  const isPassword = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="relative">
        <Input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          className={cn(
            "h-12 rounded-lg border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary",
            isPassword && "pr-11",
            className,
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
          </button>
        )}
      </div>
    </label>
  );
}

