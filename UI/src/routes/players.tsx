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
  const [picked, setPicked] = useState<string[]>(() => {
    const raw = getFlow<any[]>(FLOW_KEYS.selectedPlayerIds, []);
    return Array.from(new Set((raw ?? []).map((x) => String(x?._id ?? x?.playerId ?? x))));
  });
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

  const wkCount = useMemo(() => pickedPlayers.filter((p) => p.role === "Wicket-Keeper").length, [pickedPlayers]);
  const batCount = useMemo(() => pickedPlayers.filter((p) => p.role === "Batsman").length, [pickedPlayers]);
  const arCount = useMemo(() => pickedPlayers.filter((p) => p.role === "All-Rounder").length, [pickedPlayers]);
  const bowlCount = useMemo(() => pickedPlayers.filter((p) => p.role === "Bowler").length, [pickedPlayers]);

  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pickedPlayers) {
      if (p.realTeam) {
        counts[p.realTeam] = (counts[p.realTeam] || 0) + 1;
      }
    }
    return counts;
  }, [pickedPlayers]);

  function toggle(id: string) {
    setError("");
    const player = players.find((p) => p.playerId === id);
    if (!player || player.isAvailable === false) return;

    if (picked.includes(id)) {
      setPicked((current) => current.filter((x) => x !== id));
      return;
    }

    if (picked.length >= 11) {
      setError("You have already selected 11 players. Unselect a player first to make changes.");
      return;
    }

    if (creditsUsed + (player.credits ?? 0) > 100) {
      setError(`Cannot add ${player.name}. Total credits would exceed 100.`);
      return;
    }

    if (player.realTeam && (teamCounts[player.realTeam] || 0) >= 7) {
      setError(`Maximum 7 players allowed from ${player.realTeam}.`);
      return;
    }

    // Role-specific max limits
    if (player.role === "Wicket-Keeper" && wkCount >= 4) {
      setError("Maximum 4 Wicket-Keepers allowed.");
      return;
    }
    if (player.role === "Batsman" && batCount >= 6) {
      setError("Maximum 6 Batsmen allowed.");
      return;
    }
    if (player.role === "All-Rounder" && arCount >= 4) {
      setError("Maximum 4 All-Rounders allowed.");
      return;
    }
    if (player.role === "Bowler" && bowlCount >= 6) {
      setError("Maximum 6 Bowlers allowed.");
      return;
    }

    setPicked((current) => {
      if (current.includes(id)) return current;
      return [...current, id];
    });
  }

  function continueTeam() {
    setError("");
    if (!matchId) return setError("Select a match first.");
    if (picked.length !== 11) {
      return setError(`Please select exactly 11 players. Currently selected: ${picked.length}/11.`);
    }
    if (wkCount < 1 || wkCount > 4) {
      return setError(`Select between 1 and 4 Wicket-Keepers (currently: ${wkCount}).`);
    }
    if (batCount < 3 || batCount > 6) {
      return setError(`Select between 3 and 6 Batsmen (currently: ${batCount}).`);
    }
    if (arCount < 1 || arCount > 4) {
      return setError(`Select between 1 and 4 All-Rounders (currently: ${arCount}).`);
    }
    if (bowlCount < 3 || bowlCount > 6) {
      return setError(`Select between 3 and 6 Bowlers (currently: ${bowlCount}).`);
    }

    setFlow(FLOW_KEYS.selectedPlayerIds, picked);
    setFlow(FLOW_KEYS.selectedMatchId, matchId);
    navigate({ to: "/captain" });
  }

  return (
    <AppShell>
      <PageHeader
        title={editingTeamId ? `Edit ${flowName}` : "Select Players"}
        back={editingTeamId ? "/create-team" : "/matches"}
        right={
          <span>
            <span className="block text-[10px] uppercase tracking-wider">Credits Left</span>
            <span className="font-display text-sm font-bold text-primary">
              {(100 - creditsUsed).toFixed(1)}/100
            </span>
          </span>
        }
      />

      {/* Selection Stats Bar */}
      <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-3 text-xs">
        <div className="flex items-center justify-between border-r border-border pr-3">
          <span className="text-muted-foreground">Players Picked</span>
          <span className="font-display text-sm font-black text-foreground">{picked.length}/11</span>
        </div>
        <div className="flex items-center justify-between pl-1">
          <span className="text-muted-foreground">Teams Ratio</span>
          <span className="font-display text-xs font-bold text-primary">
            {Object.entries(teamCounts).length === 0
              ? "0 - 0"
              : Object.entries(teamCounts)
                  .map(([team, count]) => `${team}: ${count}`)
                  .join(" · ")}
          </span>
        </div>
      </div>

      {/* Role Counts Pills */}
      <div className="mb-4 grid grid-cols-4 gap-1.5 text-center text-[10px]">
        <div className={`rounded-lg border px-1.5 py-1 ${wkCount >= 1 && wkCount <= 4 ? "border-primary/40 bg-primary/10 text-primary font-bold" : "border-border bg-surface-2 text-muted-foreground"}`}>
          WK: {wkCount} (1-4)
        </div>
        <div className={`rounded-lg border px-1.5 py-1 ${batCount >= 3 && batCount <= 6 ? "border-primary/40 bg-primary/10 text-primary font-bold" : "border-border bg-surface-2 text-muted-foreground"}`}>
          BAT: {batCount} (3-6)
        </div>
        <div className={`rounded-lg border px-1.5 py-1 ${arCount >= 1 && arCount <= 4 ? "border-primary/40 bg-primary/10 text-primary font-bold" : "border-border bg-surface-2 text-muted-foreground"}`}>
          AR: {arCount} (1-4)
        </div>
        <div className={`rounded-lg border px-1.5 py-1 ${bowlCount >= 3 && bowlCount <= 6 ? "border-primary/40 bg-primary/10 text-primary font-bold" : "border-border bg-surface-2 text-muted-foreground"}`}>
          BOWL: {bowlCount} (3-6)
        </div>
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
          const disabled = p.isAvailable === false;
          return (
            <div
              key={p.playerId}
              className={cn(
                "grid grid-cols-[1fr_70px_70px_44px] items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0 hover:bg-surface-2/40 transition-colors",
                disabled && "opacity-50",
                on && "bg-primary/5"
              )}
            >
              <div>
                <p className="font-semibold text-foreground">{p.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.role}
                  {p.isPlayingXI ? " · Playing XI" : ""}
                  {disabled ? " · Not in this match" : ""}
                </p>
              </div>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-center text-xs font-bold text-foreground">
                {p.realTeam ?? "-"}
              </span>
              <span className="font-display text-sm font-bold text-primary">
                {p.credits != null ? p.credits.toFixed(1) : "-"}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggle(p.playerId)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border transition-colors shadow-sm",
                  disabled
                    ? "cursor-not-allowed border-border text-muted-foreground"
                    : on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/50 text-primary hover:bg-primary/15 hover:border-primary"
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