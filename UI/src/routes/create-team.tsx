import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Eye, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview, type PitchPlayer } from "@/components/fc/TeamPitchPreview";
import { LoadingState } from "@/components/fc/ListState";
import { getMatchPlayers, getMyTeams, getMatch, getMatches, deleteTeam } from "@/lib/api-services";
import type { FantasyTeam, MatchPlayer, Match } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/create-team")({ component: MyTeams });

function MyTeams() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const [match, setMatch] = useState<Match | null>(null);
  const [matchList, setMatchList] = useState<Match[]>([]);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewTeam, setPreviewTeam] = useState<FantasyTeam | null>(null);
  const [previewMode, setPreviewMode] = useState<"readable" | "pitch">("readable");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [allMatches, allTeams] = await Promise.all([
          getMatches().catch(() => []),
          getMyTeams(matchId || undefined).catch(() => []),
        ]);
        setMatchList(allMatches);
        setTeams(allTeams);

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
    if (!matchId) {
      navigate({ to: "/matches" });
      return;
    }
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

  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDeleteTeam(t: FantasyTeam) {
    const confirmed = window.confirm(`Are you sure you want to delete "${t.name}"?`);
    if (!confirmed) return;
    setDeletingId(t._id);
    try {
      await deleteTeam(t._id);
      setTeams((prev) => prev.filter((item) => item._id !== t._id));
    } catch (err: any) {
      alert(err?.message || "Failed to delete team");
    } finally {
      setDeletingId(null);
    }
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
        title={match ? `${match.teamA} vs ${match.teamB} · My Teams` : `My Teams (${teams.length})`}
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

      {!loading && teams.length === 0 && (
        <Card className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-3 font-display text-base font-bold">No Teams Created Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Build your fantasy cricket team with 11 players and compete in contests!
          </p>
          {matchId ? (
            <Button onClick={handleCreateNewTeam} variant="hero" size="xl" className="mt-6 gap-2">
              <Plus className="h-5 w-5" /> CREATE TEAM 1
            </Button>
          ) : (
            <Button asChild variant="hero" size="xl" className="mt-6 gap-2">
              <Link to="/matches">
                <Plus className="h-5 w-5" /> SELECT A MATCH TO BUILD A TEAM
              </Link>
            </Button>
          )}
        </Card>
      )}

      {!loading && teams.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {teams.length} {teams.length === 1 ? "Team" : "Teams"} Saved
            </span>
            <Button
              onClick={handleCreateNewTeam}
              variant="outlineGreen"
              size="sm"
              className="gap-1.5 font-bold"
            >
              <Plus className="h-3.5 w-3.5" /> {matchId ? `CREATE TEAM ${teams.length + 1}` : "BUILD NEW TEAM"}
            </Button>
          </div>

          {teams.map((t, idx) => {
            const squad = getSquadForTeam(t);
            const captainId = String((t.captainId as any)?._id ?? t.captainId ?? "");
            const viceCaptainId = String((t.viceCaptainId as any)?._id ?? t.viceCaptainId ?? "");
            const capName = getPlayerName(t.captainId);
            const vcName = getPlayerName(t.viceCaptainId);
            const teamMatch = matchList.find((m) => m._id === t.matchId) || match;

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
                    {teamMatch && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        {teamMatch.teamA} vs {teamMatch.teamB}
                      </span>
                    )}
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

                {/* Action Buttons: EDIT, VIEW and DELETE */}
                <div className="grid grid-cols-3 gap-2 border-t border-border bg-surface-2/40 p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTeam(t)}
                    disabled={t.isLocked}
                    className="gap-1.5 border-border bg-surface text-foreground hover:bg-surface-2 font-bold text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" /> EDIT
                  </Button>
                  <Button
                    type="button"
                    variant="outlineGreen"
                    size="sm"
                    onClick={() => setPreviewTeam(t)}
                    className="gap-1.5 font-bold text-xs"
                  >
                    <Eye className="h-3.5 w-3.5" /> VIEW
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTeam(t)}
                    disabled={deletingId === t._id || t.isLocked}
                    className="gap-1.5 font-bold text-xs border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" /> {deletingId === t._id ? "DELETING..." : "DELETE"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Readable Team View Modal with Pitch and List toggles */}
      {previewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/40 bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {previewTeam.name || "Fantasy Team"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Credits: <b className="text-primary">{previewTeam.totalCredits ? previewTeam.totalCredits.toFixed(1) : "0.0"}/100</b> &bull; 11 Players
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewTeam(null)}
                className="h-8 w-8 rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* View Toggle Bar */}
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1 border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewMode("readable")}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    previewMode === "readable"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  SQUAD LIST (11)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("pitch")}
                  className={`rounded-lg py-1.5 text-xs font-bold transition-colors ${
                    previewMode === "pitch"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  PITCH VIEW
                </button>
              </div>

              {previewMode === "readable" ? (
                <div className="space-y-3">
                  {/* Captain & Vice-Captain Banner */}
                  {(() => {
                    const capName = getPlayerName(previewTeam.captainId);
                    const vcName = getPlayerName(previewTeam.viceCaptainId);
                    return (
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-black">
                            C
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold text-foreground">{capName}</span>
                            <span className="block text-[10px] text-amber-300 font-semibold">2X Multiplier</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-xs font-black text-black">
                            VC
                          </span>
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold text-foreground">{vcName}</span>
                            <span className="block text-[10px] text-cyan-300 font-semibold">1.5X Multiplier</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 11 Players Table */}
                  <div className="overflow-hidden rounded-xl border border-border bg-surface text-xs">
                    <div className="grid grid-cols-[1fr_55px_55px_60px] border-b border-border bg-surface-2 px-3 py-2 font-bold uppercase text-[10px] text-muted-foreground">
                      <span>Player</span>
                      <span>Team</span>
                      <span>Role</span>
                      <span className="text-right">Credits</span>
                    </div>

                    {getSquadForTeam(previewTeam).map((p, idx) => {
                      const isCap = String(p.playerId) === String((previewTeam.captainId as any)?._id ?? previewTeam.captainId);
                      const isVC = String(p.playerId) === String((previewTeam.viceCaptainId as any)?._id ?? previewTeam.viceCaptainId);

                      return (
                        <div
                          key={p.playerId || idx}
                          className={`grid grid-cols-[1fr_55px_55px_60px] items-center border-b border-border/50 px-3 py-2.5 last:border-0 transition-colors ${
                            isCap ? "bg-amber-500/5 font-semibold" : isVC ? "bg-cyan-500/5 font-semibold" : "hover:bg-surface-2/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isCap && (
                              <span className="rounded bg-amber-500 px-1 py-0.2 text-[9px] font-black text-black">
                                C
                              </span>
                            )}
                            {isVC && (
                              <span className="rounded bg-cyan-500 px-1 py-0.2 text-[9px] font-black text-black">
                                VC
                              </span>
                            )}
                            <span className="truncate text-foreground font-medium">{p.name}</span>
                          </div>

                          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-center text-[10px] font-bold text-foreground">
                            {p.realTeam || "-"}
                          </span>

                          <span className="text-[10px] text-muted-foreground truncate">
                            {p.role === "Wicket-Keeper" ? "WK" : p.role === "All-Rounder" ? "AR" : p.role === "Bowler" ? "BOWL" : "BAT"}
                          </span>

                          <span className="text-right font-display font-bold text-primary">
                            {p.credits != null ? p.credits.toFixed(1) : "-"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-border">
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
              )}

              {/* Action Buttons: Edit Team and Close */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const t = previewTeam;
                    setPreviewTeam(null);
                    handleEditTeam(t);
                  }}
                  disabled={previewTeam.isLocked}
                  className="gap-2 border-border bg-surface text-foreground hover:bg-surface-2 text-xs font-bold"
                >
                  <Pencil className="h-3.5 w-3.5" /> EDIT TEAM
                </Button>
                <Button
                  type="button"
                  variant="hero"
                  size="lg"
                  onClick={() => setPreviewTeam(null)}
                  className="text-xs font-bold"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}