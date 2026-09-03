import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Check, ArrowDown, Eye } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, Tabs } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview } from "@/components/fc/TeamPitchPreview";
import { cn } from "@/lib/utils";
import { getMatchPlayers } from "@/lib/api-services";
import type { MatchPlayer } from "@/lib/api-types";
import { getFlow, setFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/players")({ component: Players });

const roleTabs = ["Wicket-Keeper", "Batsman", "All-Rounder", "Bowler"];

function Players() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const editingTeamId = getFlow<string | null>(FLOW_KEYS.editingTeamId, null);
  const flowName = getFlow<string>(FLOW_KEYS.selectedTeamName, "My Team");
  const [tab, setTab] = useState("Batsman");
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [picked, setPicked] = useState<string[]>(getFlow(FLOW_KEYS.selectedPlayerIds, []));
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (matchId) {
      void getMatchPlayers(matchId)
        .then(setPlayers)
        .catch((e) => setError(e.message));
    }
  }, [matchId]);

  const list = useMemo(() => players.filter((p) => p.role === tab), [players, tab]);
  const pickedPlayers = useMemo(
    () => players.filter((p) => picked.includes(p.playerId)),
    [players, picked]
  );
  const creditsUsed = pickedPlayers.reduce((s, p) => s + (p.credits ?? 0), 0);

  function toggle(id: string) {
    const player = players.find((p) => p.playerId === id);
    if (!player || !player.isAvailable) return;
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= 11) return current;
      if (creditsUsed + (player.credits ?? 0) > 100) return current;
      return [...current, id];
    });
  }

  function continueTeam() {
    if (!matchId) return setError("Select a match first.");
    if (picked.length !== 11) return setError("Select exactly 11 players before continuing.");
    setFlow(FLOW_KEYS.selectedPlayerIds, picked);
    setFlow(FLOW_KEYS.selectedMatchId, matchId);
    navigate({ to: "/captain" });
  }

  return (
    <AppShell>
      <PageHeader
        title={editingTeamId ? `Edit ${flowName}` : "Select Players"}
        back={editingTeamId ? "/create-team" : "/match-details"}
        right={
          <span>
            <span className="block text-[10px] uppercase tracking-wider">Credits Left</span>
            <span className="font-display text-sm font-bold text-primary">
              {(100 - creditsUsed).toFixed(1)}/100
            </span>
          </span>
        }
      />
      <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
        <span className="text-xs text-muted-foreground">Players Selected</span>
        <span className="font-display text-sm font-bold">{picked.length}/11</span>
      </div>
      <Tabs items={roleTabs} active={tab} onChange={setTab} variant="pill" />
      {error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <Card className="mt-5 p-0">
        <div className="grid grid-cols-[1fr_70px_70px_44px] items-center gap-2 border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Player</span>
          <span>Team</span>
          <span>
            Credits <ArrowDown className="inline h-3 w-3" />
          </span>
          <span />
        </div>
        {list.map((p) => {
          const on = picked.includes(p.playerId);
          const disabled = !p.isAvailable;
          return (
            <div
              key={p.playerId}
              className={cn(
                "grid grid-cols-[1fr_70px_70px_44px] items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0",
                disabled && "opacity-50",
              )}
            >
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.role}
                  {p.isPlayingXI ? " · Playing XI" : ""}
                  {disabled ? " · Not in this match" : ""}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">{p.realTeam ?? "-"}</span>
              <span className="font-display text-sm font-bold">
                {p.credits != null ? p.credits.toFixed(1) : "-"}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(p.playerId)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                  disabled
                    ? "cursor-not-allowed border-border text-muted-foreground"
                    : on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/50 text-primary hover:bg-primary/10",
                )}
              >
                {on ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
          );
        })}
        {!list.length && (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No players available for this role.
          </p>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="xl"
          disabled={picked.length === 0}
          onClick={() => setShowPreview(true)}
          className="gap-2 border-border bg-surface text-foreground hover:bg-surface-2"
        >
          <Eye className="h-4 w-4" /> PREVIEW
        </Button>
        <Button
          type="button"
          disabled={picked.length !== 11}
          onClick={continueTeam}
          variant="hero"
          size="xl"
          className="w-full"
        >
          CONTINUE
        </Button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <TeamPitchPreview
              players={pickedPlayers}
              teamName={flowName}
              totalCredits={creditsUsed}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}