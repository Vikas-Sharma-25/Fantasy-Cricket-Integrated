import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Pencil, Save } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { LoadingState } from "@/components/fc/ListState";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview } from "@/components/fc/TeamPitchPreview";
import { getMatchPlayers, createTeam, updateTeam } from "@/lib/api-services";
import type { MatchPlayer } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/captain")({ component: Captain });

function Captain() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const editingTeamId = getFlow<string | null>(FLOW_KEYS.editingTeamId, null);
  const rawIds = getFlow<any[]>(FLOW_KEYS.selectedPlayerIds, []);
  const ids = (rawIds ?? []).map((x) => String(x?._id ?? x?.playerId ?? x));
  const name = getFlow<string>(FLOW_KEYS.selectedTeamName, "My Team");
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cap, setCap] = useState(getFlow(FLOW_KEYS.captainId, ""));
  const [vice, setVice] = useState(getFlow(FLOW_KEYS.viceCaptainId, ""));
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (matchId) {
      setLoading(true);
      void getMatchPlayers(matchId)
        .then((res) => {
          setPlayers(res);
        })
        .catch((e) => {
          setError(e.message ?? "Failed to load players");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [matchId]);

  const squad = players.filter((p) => {
    const pid = String(p.playerId ?? p._id ?? "");
    return ids.includes(pid);
  });
  const creditsUsed = squad.reduce((s, p) => s + (p.credits ?? 0), 0);

  async function save() {
    if (!matchId) return setError("Match not selected. Please go back and select a match.");
    if (squad.length !== 11) {
      setError(`Your team has ${squad.length}/11 players. Please go back to player selection and pick 11 players.`);
      return;
    }
    if (!cap || !vice) {
      setError("Please select both a Captain and a Vice-Captain.");
      return;
    }
    if (cap === vice) {
      setError("Captain and Vice-Captain must be different players.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingTeamId) {
        await updateTeam(editingTeamId, {
          name,
          playerIds: ids,
          captainId: cap,
          viceCaptainId: vice,
        });
      } else {
        await createTeam({
          matchId,
          name,
          playerIds: ids,
          captainId: cap,
          viceCaptainId: vice,
        });
      }

      // Clear drafting state
      removeFlow(FLOW_KEYS.editingTeamId);
      removeFlow(FLOW_KEYS.selectedPlayerIds);
      removeFlow(FLOW_KEYS.captainId);
      removeFlow(FLOW_KEYS.viceCaptainId);

      const returnContestId = getFlow<string | null>(FLOW_KEYS.returnToContestId, null);
      if (returnContestId) {
        setFlow(FLOW_KEYS.autoOpenJoinContestId, returnContestId);
        removeFlow(FLOW_KEYS.returnToContestId);
        navigate({ to: "/contests" });
      } else {
        navigate({ to: "/create-team" });
      }
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Unable to save team");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        back="/players"
        title={
          <span className="flex items-center gap-2">
            {name}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        }
      />

      {loading && <LoadingState label="Loading squad players..." />}

      {!loading && squad.length === 0 && (
        <Card className="py-8 text-center">
          <p className="text-sm text-destructive font-semibold">
            No players selected for this team.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Please go back to the player selection screen and select 11 players.
          </p>
          <Button
            type="button"
            variant="hero"
            size="lg"
            className="mt-4"
            onClick={() => navigate({ to: "/players" })}
          >
            GO TO PLAYER SELECTION
          </Button>
        </Card>
      )}

      {!loading && squad.length > 0 && (
        <>
          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-base font-bold">Select Captain</h2>
              <span className="text-xs font-semibold text-accent">2X Points</span>
            </div>
            <div className="space-y-2.5">
              {squad.map((p) => {
                const pid = String(p.playerId ?? p._id);
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      setCap(pid);
                      setFlow(FLOW_KEYS.captainId, pid);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      cap === pid
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-surface-2 hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        cap === pid
                          ? "bg-amber-500 font-extrabold text-black"
                          : "bg-surface text-foreground"
                      }`}
                    >
                      C
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {p.credits?.toFixed(1)} Credits · {p.realTeam} · {p.role}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="mt-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-base font-bold">Select Vice Captain</h2>
              <span className="text-xs font-semibold text-accent">1.5X Points</span>
            </div>
            <div className="space-y-2.5">
              {squad.map((p) => {
                const pid = String(p.playerId ?? p._id);
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => {
                      setVice(pid);
                      setFlow(FLOW_KEYS.viceCaptainId, pid);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                      vice === pid
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-surface-2 hover:bg-surface"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        vice === pid
                          ? "bg-cyan-500 font-extrabold text-black"
                          : "bg-surface text-foreground"
                      }`}
                    >
                      VC
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold">{p.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {p.credits?.toFixed(1)} Credits · {p.realTeam} · {p.role}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          size="xl"
          onClick={() => setShowPreview(true)}
          className="gap-2 border-border bg-surface text-foreground hover:bg-surface-2"
        >
          <Eye className="h-4 w-4" /> PREVIEW
        </Button>
        <Button
          onClick={save}
          disabled={saving || !cap || !vice || cap === vice}
          variant="hero"
          size="xl"
          className="gap-2"
        >
          <Save className="h-4 w-4" /> {saving ? "SAVING..." : "SAVE TEAM"}
        </Button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <TeamPitchPreview
              players={squad}
              captainId={cap}
              viceCaptainId={vice}
              teamName={name}
              totalCredits={creditsUsed}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}