import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview, type PitchPlayer } from "@/components/fc/TeamPitchPreview";
import { LoadingState } from "@/components/fc/ListState";
import { getMatchPlayers, getMyTeams, getMatch } from "@/lib/api-services";
import type { FantasyTeam, MatchPlayer, Match } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/create-team")({ component: MyTeams });

function MyTeams() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const [match, setMatch] = useState<Match | null>(null);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTeam, setPreviewTeam] = useState<FantasyTeam | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (matchId) {
          const [matchData, teamList, matchPlayers] = await Promise.all([
            getMatch(matchId).catch(() => null),
            getMyTeams(matchId).catch(() => []),
            getMatchPlayers(matchId).catch(() => []),
          ]);
          setMatch(matchData);
          setTeams(teamList);
          setPlayers(matchPlayers);
        } else {
          // If no match is selected, load all user's teams
          const allTeams = await getMyTeams().catch(() => []);
          setTeams(allTeams);
        }
      } finally {
        setLoading(false);
      }
    }
    void loadData();
  }, [matchId]);

  function handleCreateNewTeam() {
    removeFlow(FLOW_KEYS.editingTeamId);
    removeFlow(FLOW_KEYS.selectedPlayerIds);
    removeFlow(FLOW_KEYS.captainId);
    removeFlow(FLOW_KEYS.viceCaptainId);
    if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${teams.length + 1}`);
    navigate({ to: "/players" });
  }

  function handleEditTeam(team: FantasyTeam) {
    const rawPlayerIds = (team.playerIds ?? []).map((p: any) => String(p?._id ?? p?.playerId ?? p));
    const capId = String((team.captainId as any)?._id ?? team.captainId ?? "");
    const vcId = String((team.viceCaptainId as any)?._id ?? team.viceCaptainId ?? "");

    setFlow(FLOW_KEYS.editingTeamId, team._id);
    setFlow(FLOW_KEYS.selectedMatchId, team.matchId);
    setFlow(FLOW_KEYS.selectedTeamName, team.name || `Team`);
    setFlow(FLOW_KEYS.selectedPlayerIds, rawPlayerIds);
    setFlow(FLOW_KEYS.captainId, capId);
    setFlow(FLOW_KEYS.viceCaptainId, vcId);

    navigate({ to: "/players" });
  }

  function getSquadForTeam(team: FantasyTeam): PitchPlayer[] {
    return (team.playerIds ?? []).map((player: any) => {
      const pid = String(player?._id ?? player?.playerId ?? player);
      const matchPlayer = players.find((mp) => mp.playerId === pid);
      return {
        playerId: pid,
        name: matchPlayer?.name ?? player?.name ?? "Player",
        role: matchPlayer?.role ?? player?.role ?? "Batsman",
        realTeam: matchPlayer?.realTeam ?? player?.realTeam ?? "-",
        credits: matchPlayer?.credits ?? player?.credits ?? null,
      };
    });
  }

  function getPlayerName(playerIdOrObj: any) {
    const pid = String(playerIdOrObj?._id ?? playerIdOrObj?.playerId ?? playerIdOrObj ?? "");
    const matchPlayer = players.find((mp) => mp.playerId === pid);
    return matchPlayer?.name ?? playerIdOrObj?.name ?? "Player";
  }

  return (
    <AppShell>
      <PageHeader
        back="/matches"
        title={match ? `${match.teamA} vs ${match.teamB} · My Teams` : "My Teams"}
      />

      {loading && <LoadingState label="Loading your teams..." />}

      {!loading && !matchId && (
        <Card className="text-center">
          <p className="text-sm text-muted-foreground">Select a match to view or create teams.</p>
          <Button asChild variant="hero" className="mt-4">
            <Link to="/matches">SELECT A MATCH</Link>
          </Button>
        </Card>
      )}

      {!loading && matchId && teams.length === 0 && (
        <Card className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-3 font-display text-base font-bold">No Teams Created Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Build your fantasy cricket team with 11 players and compete in contests!
          </p>
          <Button onClick={handleCreateNewTeam} variant="hero" size="xl" className="mt-6 gap-2">
            <Plus className="h-5 w-5" /> CREATE TEAM 1
          </Button>
        </Card>
      )}

      {!loading && matchId && teams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {teams.length} {teams.length === 1 ? "Team" : "Teams"} Created
            </span>
            <Button
              onClick={handleCreateNewTeam}
              variant="outlineGreen"
              size="sm"
              className="gap-1.5 font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> CREATE TEAM {teams.length + 1}
            </Button>
          </div>

          {teams.map((t, idx) => {
            const squad = getSquadForTeam(t);
            const captainId = String((t.captainId as any)?._id ?? t.captainId ?? "");
            const viceCaptainId = String((t.viceCaptainId as any)?._id ?? t.viceCaptainId ?? "");
            const capName = getPlayerName(t.captainId);
            const vcName = getPlayerName(t.viceCaptainId);

            const wkCount = squad.filter((p) => p.role === "Wicket-Keeper").length;
            const batCount = squad.filter((p) => p.role === "Batsman").length;
            const arCount = squad.filter((p) => p.role === "All-Rounder").length;
            const bowlCount = squad.filter((p) => p.role === "Bowler").length;

            return (
              <Card key={t._id} className="p-0 overflow-hidden border-border/80">
                {/* Team Card Header */}
                <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="font-display text-sm font-bold text-foreground">
                      {t.name || `Team ${idx + 1}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-primary">
                      {t.totalCredits ? t.totalCredits.toFixed(1) : "0.0"} / 100 Cr
                    </span>
                  </div>
                </div>

                {/* Team Details */}
                <div className="p-4 space-y-3">
                  {/* Captain & Vice Captain Section */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 font-display text-[10px] font-extrabold text-black">
                        C
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{capName}</span>
                        <span className="block text-[10px] text-muted-foreground">Captain &bull; 2X</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 font-display text-[10px] font-extrabold text-black">
                        VC
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-bold">{vcName}</span>
                        <span className="block text-[10px] text-muted-foreground">Vice-Cap &bull; 1.5X</span>
                      </div>
                    </div>
                  </div>

                  {/* Role composition tags */}
                  <div className="flex items-center justify-between rounded-md bg-surface-2/60 px-3 py-1.5 text-[11px] text-muted-foreground">
                    <span>WK: <b className="text-foreground">{wkCount}</b></span>
                    <span>BAT: <b className="text-foreground">{batCount}</b></span>
                    <span>AR: <b className="text-foreground">{arCount}</b></span>
                    <span>BOWL: <b className="text-foreground">{bowlCount}</b></span>
                  </div>
                </div>

                {/* Action Buttons: EDIT and VIEW */}
                <div className="grid grid-cols-2 gap-3 border-t border-border bg-surface-2/40 p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => handleEditTeam(t)}
                    disabled={t.isLocked}
                    className="gap-2 border-border bg-surface text-foreground hover:bg-surface-2"
                  >
                    <Pencil className="h-4 w-4" /> EDIT
                  </Button>
                  <Button
                    type="button"
                    variant="outlineGreen"
                    size="lg"
                    onClick={() => setPreviewTeam(t)}
                    className="gap-2 font-bold"
                  >
                    <Eye className="h-4 w-4" /> VIEW
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Team Pitch Preview Modal */}
      {previewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <TeamPitchPreview
              players={getSquadForTeam(previewTeam)}
              captainId={String((previewTeam.captainId as any)?._id ?? previewTeam.captainId ?? "")}
              viceCaptainId={String(
                (previewTeam.viceCaptainId as any)?._id ?? previewTeam.viceCaptainId ?? ""
              )}
              teamName={previewTeam.name}
              totalCredits={previewTeam.totalCredits}
              onClose={() => setPreviewTeam(null)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}