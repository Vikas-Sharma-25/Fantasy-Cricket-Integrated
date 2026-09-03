import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface PitchPlayer {
  playerId: string;
  name: string;
  role: string;
  realTeam?: string | null;
  credits?: number | null;
}

interface TeamPitchPreviewProps {
  players: PitchPlayer[];
  captainId?: string | null;
  viceCaptainId?: string | null;
  teamName?: string;
  totalCredits?: number;
  onClose?: () => void;
  className?: string;
}

const ROLE_ORDER = [
  { key: "Wicket-Keeper", label: "WICKET-KEEPERS", short: "WK" },
  { key: "Batsman", label: "BATSMEN", short: "BAT" },
  { key: "All-Rounder", label: "ALL-ROUNDERS", short: "AR" },
  { key: "Bowler", label: "BOWLERS", short: "BOWL" },
];

export function TeamPitchPreview({
  players,
  captainId,
  viceCaptainId,
  teamName = "Team Preview",
  totalCredits,
  onClose,
  className,
}: TeamPitchPreviewProps) {
  const creditsUsed =
    totalCredits !== undefined
      ? totalCredits
      : players.reduce((sum, p) => sum + (p.credits ?? 0), 0);

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-surface shadow-2xl",
        className,
      )}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-border/80 bg-background/90 px-4 py-3 backdrop-blur">
        <div>
          <h3 className="font-display text-base font-bold text-foreground">{teamName}</h3>
          <p className="text-[11px] text-muted-foreground">
            {players.length}/11 Players &bull; <span className="font-semibold text-primary">{creditsUsed.toFixed(1)}/100 Cr</span>
          </p>
        </div>
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close Preview"
            className="h-8 w-8 rounded-full border border-border bg-surface text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Cricket Pitch Ground */}
      <div className="relative min-h-[440px] flex-1 overflow-hidden bg-[radial-gradient(ellipse_at_center,oklch(0.42_0.14_148)_0%,oklch(0.28_0.10_148)_55%,oklch(0.18_0.07_148)_100%)] p-4 sm:p-6">
        {/* Subtle Pitch Markings / Pitch Rectangle */}
        <div className="pointer-events-none absolute inset-x-[22%] top-6 bottom-6 rounded-xl border border-emerald-300/15 bg-emerald-950/20" />
        <div className="pointer-events-none absolute inset-x-[22%] top-[30%] h-px bg-emerald-300/20" />
        <div className="pointer-events-none absolute inset-x-[22%] top-[70%] h-px bg-emerald-300/20" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/15" />

        {/* Roles Layout: WK -> BAT -> AR -> BOWL */}
        <div className="relative z-10 flex flex-col justify-between gap-5">
          {ROLE_ORDER.map(({ key, label }) => {
            const rolePlayers = players.filter((p) => p.role === key);
            return (
              <div key={key} className="flex flex-col items-center">
                <span className="mb-2 rounded bg-black/40 px-2 py-0.5 text-[9px] font-bold tracking-widest text-emerald-200/90">
                  {label} ({rolePlayers.length})
                </span>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                  {rolePlayers.map((p) => {
                    const isCap = p.playerId === captainId;
                    const isVice = p.playerId === viceCaptainId;

                    return (
                      <div
                        key={p.playerId}
                        className="group flex flex-col items-center transition-transform hover:scale-105"
                      >
                        {/* Jersey / Team Avatar */}
                        <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/60 bg-background/90 shadow-md backdrop-blur">
                          <span className="font-display text-[11px] font-extrabold uppercase text-foreground">
                            {p.realTeam ?? "XI"}
                          </span>

                          {/* Captain Badge */}
                          {isCap && (
                            <span
                              title="Captain (2x Points)"
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-yellow-400 bg-amber-500 font-display text-[9px] font-extrabold text-black shadow"
                            >
                              C
                            </span>
                          )}

                          {/* Vice Captain Badge */}
                          {isVice && (
                            <span
                              title="Vice-Captain (1.5x Points)"
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-blue-400 bg-cyan-500 font-display text-[8px] font-extrabold text-black shadow"
                            >
                              VC
                            </span>
                          )}
                        </div>

                        {/* Player Name Pill */}
                        <span className="mt-1 max-w-[84px] truncate rounded bg-black/75 px-1.5 py-0.5 text-center text-[10px] font-bold text-white shadow-sm">
                          {p.name}
                        </span>

                        {/* Credits */}
                        <span className="text-[10px] font-semibold text-emerald-100 drop-shadow">
                          {p.credits != null ? `${p.credits.toFixed(1)} Cr` : ""}
                        </span>
                      </div>
                    );
                  })}
                  {!rolePlayers.length && (
                    <span className="text-[11px] italic text-emerald-200/50">None selected</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer / Info */}
      <div className="flex items-center justify-between border-t border-border/80 bg-background/90 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-extrabold text-black">
              C
            </span>
            <span>2X Points</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[7px] font-extrabold text-black">
              VC
            </span>
            <span>1.5X Points</span>
          </span>
        </div>
        {onClose && (
          <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs">
            Close
          </Button>
        )}
      </div>
    </div>
  );
}

