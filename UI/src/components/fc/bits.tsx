import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { teamColors } from "./data";

function getTeamCode(team: string): string {
  if (!team) return "";
  const t = team.trim();
  const known: Record<string, string> = {
    "England": "ENG",
    "Pakistan": "PAK",
    "India": "IND",
    "Australia": "AUS",
    "Guyana Amazon Warriors": "GAW",
    "Antigua and Barbuda Falcons": "ABF",
    "South Africa": "SA",
    "West Indies": "WI",
    "New Zealand": "NZ",
    "Sri Lanka": "SL",
    "Afghanistan": "AFG",
    "Bangladesh": "BAN",
    "Zimbabwe": "ZIM",
    "Ireland": "IRE",
    "Netherlands": "NED",
    "Scotland": "SCO",
  };
  if (known[t]) return known[t];
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  }
  return t.slice(0, 3).toUpperCase();
}

export function TeamBadge({ team, size = 40 }: { team: string; size?: number }) {
  const code = getTeamCode(team);
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-display text-xs font-bold text-foreground overflow-hidden"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklab, ${teamColors[team] ?? "oklch(0.4 0 0)"} 55%, transparent)`,
        border: `1px solid ${teamColors[team] ?? "oklch(0.4 0 0)"}`,
      }}
      title={team}
    >
      {code}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    LIVE: "bg-destructive text-destructive-foreground",
    UPCOMING: "border border-border bg-surface-2 text-muted-foreground",
    COMPLETED: "bg-primary/20 text-primary border border-primary/40",
    LOCKED: "border border-border bg-surface text-muted-foreground",
    FREE: "bg-primary/15 text-primary border border-primary/40",
  };
  return (
    <span
      className={cn(
        "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
        map[status.toUpperCase()] ?? map["UPCOMING"],
      )}
    >
      {status}
    </span>
  );
}

export function Card({ className, children }: { className?: string | undefined; children: ReactNode }) {
  return <div className={cn("surface-card p-4", className)}>{children}</div>;
}

export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
      <div className="h-full rounded-full gradient-primary" style={{ width: `${value}%` }} />
    </div>
  );
}

export function Tabs({
  items,
  active,
  onChange,
  variant = "underline",
}: {
  items: string[];
  active: string;
  onChange: (v: string) => void;
  variant?: "underline" | "pill";
}) {
  if (variant === "pill") {
    return (
      <div className="scrollbar-none flex gap-2 overflow-x-auto">
        {items.map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={cn(
              "shrink-0 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors",
              active === i
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            {i}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="scrollbar-none flex gap-6 overflow-x-auto border-b border-border">
      {items.map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={cn(
            "shrink-0 border-b-2 pb-3 text-sm font-semibold transition-colors",
            active === i
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

export function OtpBoxes({ digits }: { digits: string[] }) {
  return (
    <div className="flex justify-between gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          defaultValue={d}
          maxLength={1}
          inputMode="numeric"
          aria-label={`OTP digit ${i + 1}`}
          className="h-14 w-full rounded-lg border border-border bg-surface text-center font-display text-xl font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
        />
      ))}
    </div>
  );
}
