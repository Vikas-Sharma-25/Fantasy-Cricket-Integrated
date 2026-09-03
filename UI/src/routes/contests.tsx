import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Users,
  Trophy,
  X,
  Check,
  Eye,
  Plus,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, Tabs, StatusBadge, Progress } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview, type PitchPlayer } from "@/components/fc/TeamPitchPreview";
import {
  getContests,
  getMyContests,
  getMyTeams,
  getMatchPlayers,
  joinContest,
} from "@/lib/api-services";
import type { Contest, FantasyTeam, MatchPlayer } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/contests")({ component: Contests });

function joinedCountOf(c: Contest) {
  return c.joinedSlots ?? c.entriesCount ?? c.joinedCount ?? 0;
}

function parsePrizeNumber(prize: any): number {
  if (typeof prize === "number") return prize;
  if (!prize) return 50000;
  const cleaned = String(prize).replace(/[^\d.-]/g, "");
  const val = Number(cleaned);
  return isNaN(val) || val <= 0 ? 50000 : val;
}

function formatPrizeDisplay(prize: any): string {
  if (!prize) return "₹50,000";
  if (typeof prize === "string" && prize.toLowerCase() === "contest") return "₹50,000";
  const num = parsePrizeNumber(prize);
  return `₹${num.toLocaleString()}`;
}

function getPrizeBreakdown(prizePool: any) {
  const num = parsePrizeNumber(prizePool);
  return [
    { rank: "1st", prize: `₹${Math.round(num * 0.3).toLocaleString()}`, pct: "30%" },
    { rank: "2nd", prize: `₹${Math.round(num * 0.15).toLocaleString()}`, pct: "15%" },
    { rank: "3rd", prize: `₹${Math.round(num * 0.1).toLocaleString()}`, pct: "10%" },
    { rank: "4th - 10th", prize: `₹${Math.round(num * 0.03).toLocaleString()} each`, pct: "21%" },
    { rank: "11th - 50th", prize: `₹${Math.round(num * 0.006).toLocaleString()} each`, pct: "24%" },
  ];
}

function Contests() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const [items, setItems] = useState<Contest[]>([]);
  const [myContests, setMyContests] = useState<Contest[]>([]);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [filter, setFilter] = useState("All");
  const [top, setTop] = useState("Contests");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [joining, setJoining] = useState(false);

  // Join modal state
  const [contestToJoin, setContestToJoin] = useState<Contest | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  // My Contests view modal state
  const [viewingContest, setViewingContest] = useState<Contest | null>(null);
  const [pitchPreviewTeam, setPitchPreviewTeam] = useState<FantasyTeam | null>(null);

  function loadMyContests() {
    void getMyContests(matchId ?? undefined)
      .then(setMyContests)
      .catch(() => {});
  }

  useEffect(() => {
    if (matchId) {
      void getMyTeams(matchId)
        .then((fetchedTeams) => {
          setTeams(fetchedTeams);
          return getContests(matchId).then((fetchedContests) => {
            setItems(fetchedContests);
            const autoOpenId = getFlow<string | null>(FLOW_KEYS.autoOpenJoinContestId, null);
            if (autoOpenId) {
              removeFlow(FLOW_KEYS.autoOpenJoinContestId);
              const target = fetchedContests.find((c) => c._id === autoOpenId);
              if (target) {
                // Auto-open modal with the newest team selected
                setContestToJoin(target);
                if (fetchedTeams.length > 0) {
                  // Select the newest team (last in array)
                  setSelectedTeamId(fetchedTeams[fetchedTeams.length - 1]._id);
                }
              }
            }
          });
        })
        .catch((e) => setError(e.message));

      void getMatchPlayers(matchId)
        .then(setPlayers)
        .catch(() => {});
      loadMyContests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  const filtered = items.filter(
    (c) =>
      filter === "All" ||
      (c.type || "").toUpperCase() === (filter === "Mega" ? "PUBLIC" : filter.toUpperCase()),
  );
  const myFiltered = myContests.filter(
    (c) =>
      filter === "All" ||
      (c.type || "").toUpperCase() === (filter === "Mega" ? "PUBLIC" : filter.toUpperCase()),
  );

  function getJoinedTeamIdsForContest(contestId: string): string[] {
    return myContests
      .filter((mc) => mc._id === contestId)
      .map((mc) => String((mc.fantasyTeamId as any)?._id ?? mc.fantasyTeamId ?? ""));
  }

  function handleOpenJoinModal(c: Contest) {
    setError("");
    setSuccess("");
    setContestToJoin(c);

    // Pick first available team that hasn't joined yet
    const alreadyJoinedTeamIds = getJoinedTeamIdsForContest(c._id);
    const availableTeam = teams.find((t) => !alreadyJoinedTeamIds.includes(t._id));
    if (availableTeam) {
      setSelectedTeamId(availableTeam._id);
    } else {
      setSelectedTeamId("");
    }
  }

  function handleCreateTeamForContest() {
    if (!contestToJoin || !matchId) return;
    setFlow(FLOW_KEYS.returnToContestId, contestToJoin._id);
    setFlow(FLOW_KEYS.selectedMatchId, matchId);
    setFlow(FLOW_KEYS.selectedTeamName, `Team ${teams.length + 1}`);
    removeFlow(FLOW_KEYS.editingTeamId);
    removeFlow(FLOW_KEYS.selectedPlayerIds);
    removeFlow(FLOW_KEYS.captainId);
    removeFlow(FLOW_KEYS.viceCaptainId);
    setContestToJoin(null);
    navigate({ to: "/players" });
  }

  async function handleConfirmJoin() {
    if (!contestToJoin) return;
    if (!selectedTeamId) {
      setError("Please select a team to join the contest.");
      return;
    }

    setJoining(true);
    setError("");
    setSuccess("");

    try {
      const chosenTeam = teams.find((t) => t._id === selectedTeamId);
      const teamLabel = chosenTeam ? chosenTeam.name : "your team";

      await joinContest(contestToJoin._id, selectedTeamId);
      setFlow(FLOW_KEYS.selectedContestId, contestToJoin._id);
      setSuccess(`🎉 Contest joined successfully with ${teamLabel}!`);

      // Optimistically update slot counts
      setItems((prev) =>
        prev.map((x) =>
          x._id === contestToJoin._id
            ? { ...x, joinedSlots: joinedCountOf(x) + 1 }
            : x,
        ),
      );

      // Refresh My Contests list
      loadMyContests();
      setContestToJoin(null);

      // Automatically switch view to "My Contests" tab
      setTop("My Contests");
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Unable to join contest");
    } finally {
      setJoining(false);
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

  const list = top === "Contests" ? filtered : myFiltered;

  return (
    <AppShell>
      <PageHeader back="/matches" title="Contests" />
      <Tabs
        items={["Contests", "My Contests"]}
        active={top}
        onChange={(v) => {
          setTop(v);
          setError("");
          if (v === "My Contests") loadMyContests();
        }}
      />
      <div className="mt-4">
        <Tabs
          items={["All", "Mega", "H2H", "Private"]}
          active={filter}
          onChange={setFilter}
          variant="pill"
        />
      </div>

      {success && (
        <Card className="mt-4 border-primary/30 bg-primary/10">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </p>
        </Card>
      )}
      {error && (
        <Card className="mt-4 border-destructive/30 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      <div className="mt-5 space-y-4">
        {top === "Contests" &&
          list.map((c) => {
            const slots = c.maxSlots || 5000;
            const joinedCount = joinedCountOf(c);
            const spotsLeft = Math.max(0, slots - joinedCount);
            const filledPct = Math.min(100, (joinedCount / Math.max(1, slots)) * 100);
            const prizeFormatted = formatPrizeDisplay(c.prizePool ?? c.prize);
            const prizeNumber = parsePrizeNumber(c.prizePool ?? c.prize);
            const firstPrize = `₹${Math.round(prizeNumber * 0.3).toLocaleString()}`;
            const isFree = !c.entryFee || c.entryFee === 0;

            return (
              <Card key={c._id} className="p-0 overflow-hidden border-border/80">
                {/* Contest Card Top Bar */}
                <div className="flex items-center justify-between border-b border-border bg-surface-2/40 px-4 py-2.5">
                  <span className="font-display text-sm font-bold text-foreground">{c.name}</span>
                  <span className="rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    {isFree ? "FREE" : `₹${c.entryFee}`}
                  </span>
                </div>

                <div className="p-4">
                  {/* Prize and Spots summary */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="font-display text-2xl font-black text-primary">{prizeFormatted}</p>
                      <p className="text-[11px] text-muted-foreground">Prize Pool</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">
                        {joinedCount.toLocaleString()} / {slots.toLocaleString()} spots
                      </p>
                      <p className="text-[11px] text-muted-foreground">1st: {firstPrize}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <Progress value={filledPct} />
                  </div>

                  {/* Bottom Row: Spots left & JOIN Button */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary/70" />{" "}
                      {spotsLeft.toLocaleString()} spots left
                    </span>

                    <Button
                      onClick={() => handleOpenJoinModal(c)}
                      disabled={spotsLeft <= 0}
                      variant="hero"
                      size="sm"
                      className="px-6 font-display text-xs font-bold tracking-wider"
                    >
                      {spotsLeft <= 0 ? "FULL" : "JOIN"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

        {top === "My Contests" &&
          list.map((c) => {
            const slots = c.maxSlots || 5000;
            const joinedCount = joinedCountOf(c);
            const prizeFormatted = formatPrizeDisplay(c.prizePool ?? c.prize);

            // Resolve joined team info
            const teamObj: any = c.fantasyTeamId;
            const teamName = teamObj?.name ?? "Team 1";
            const capName = teamObj?.captainId ? getPlayerName(teamObj.captainId) : null;
            const vcName = teamObj?.viceCaptainId ? getPlayerName(teamObj.viceCaptainId) : null;

            return (
              <Card key={c.entryId || c._id} className="p-0 overflow-hidden border-border/80">
                <div className="flex items-center justify-between border-b border-border bg-surface-2/40 px-4 py-2.5">
                  <span className="font-display text-sm font-bold text-foreground">{c.name}</span>
                  <StatusBadge status={c.status || "OPEN"} />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-display text-xl font-bold text-primary">{prizeFormatted}</p>
                      <p className="text-[10px] text-muted-foreground">Prize Pool</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Max {slots.toLocaleString()} spots
                    </span>
                  </div>

                  {/* Joined Team Info Banner */}
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                          ✓
                        </span>
                        <span className="text-xs font-bold text-foreground">
                          Joined with: <span className="text-primary">{teamName}</span>
                        </span>
                      </div>
                    </div>
                    {capName && vcName && (
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span>
                          <b className="text-amber-400">C:</b> {capName}
                        </span>
                        <span>
                          <b className="text-cyan-400">VC:</b> {vcName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button: VIEW */}
                  <div className="flex justify-end pt-1">
                    <Button
                      variant="outlineGreen"
                      size="sm"
                      onClick={() => setViewingContest(c)}
                      className="gap-1.5 font-bold"
                    >
                      <Eye className="h-3.5 w-3.5" /> VIEW
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

        {!list.length && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {top === "Contests"
              ? "No contests available for this match."
              : "You haven't joined any contests yet."}
          </p>
        )}
      </div>

      <Button
        variant="outlineGreen"
        size="xl"
        className="mt-6 w-full font-bold"
        onClick={() =>
          setError(
            "Private contest creation is available through the API; add your contest details in the next step.",
          )
        }
      >
        CREATE PRIVATE CONTEST
      </Button>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: JOIN CONTEST MODAL WITH PRIZE BREAKDOWN & TEAM PICKER */}
      {/* ------------------------------------------------------------- */}
      {contestToJoin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/40 bg-surface shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Join Contest &bull; {contestToJoin.name}
                </h3>
                <p className="text-xs text-muted-foreground">Review winning prizes and select your team</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setContestToJoin(null)}
                className="h-8 w-8 rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-5">
              {/* Prize Pool Summary Card */}
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Winning Prize
                </p>
                <p className="mt-1 font-display text-3xl font-black text-primary">
                  {formatPrizeDisplay(contestToJoin.prizePool ?? contestToJoin.prize)}
                </p>
                <div className="mt-3 flex items-center justify-around border-t border-primary/20 pt-2.5 text-xs">
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Entry Fee</span>
                    <span className="font-bold text-foreground">
                      {!contestToJoin.entryFee || contestToJoin.entryFee === 0
                        ? "FREE"
                        : `₹${contestToJoin.entryFee}`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground uppercase">Spots Left</span>
                    <span className="font-bold text-foreground">
                      {Math.max(
                        0,
                        (contestToJoin.maxSlots || 5000) - joinedCountOf(contestToJoin),
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Winning Prize Distribution Table */}
              <div>
                <h4 className="mb-2.5 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Winning Prize Breakdown
                </h4>
                <div className="overflow-hidden rounded-xl border border-border bg-surface-2/40 text-xs">
                  <div className="grid grid-cols-3 border-b border-border bg-surface-2 px-3.5 py-2 font-bold uppercase text-muted-foreground text-[10px]">
                    <span>Rank</span>
                    <span className="text-center">% Share</span>
                    <span className="text-right">Prize</span>
                  </div>
                  {getPrizeBreakdown(contestToJoin.prizePool ?? contestToJoin.prize).map((r, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-3 items-center border-b border-border/50 px-3.5 py-2 last:border-0"
                    >
                      <span className="font-semibold text-foreground">{r.rank}</span>
                      <span className="text-center text-muted-foreground">{r.pct}</span>
                      <span className="text-right font-display font-bold text-primary">{r.prize}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Selection */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Select Team to Join
                  </h4>
                  {teams.length > 0 && (
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary font-bold"
                      onClick={handleCreateTeamForContest}
                    >
                      + Create New Team
                    </Button>
                  )}
                </div>

                {/* Warning banner when all existing teams have joined */}
                {teams.length > 0 &&
                  teams.filter(
                    (t) =>
                      !getJoinedTeamIdsForContest(contestToJoin._id).includes(t._id),
                  ).length === 0 && (
                    <div className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                      <p className="font-bold flex items-center gap-1.5">
                        <span>⚠️</span> All your teams have already joined this contest!
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Create a new fantasy team (Team {teams.length + 1}) to enter this contest again.
                      </p>
                    </div>
                  )}

                {teams.length === 0 ? (
                  <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      You haven't created any fantasy teams for this match yet.
                    </p>
                    <Button
                      type="button"
                      variant="hero"
                      size="sm"
                      className="mt-3 font-bold"
                      onClick={handleCreateTeamForContest}
                    >
                      + CREATE FANTASY TEAM
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {teams.map((t, idx) => {
                      const alreadyJoinedTeamIds = getJoinedTeamIdsForContest(contestToJoin._id);
                      const isAlreadyJoined = alreadyJoinedTeamIds.includes(t._id);
                      const isSelected = selectedTeamId === t._id;
                      const capName = getPlayerName(t.captainId);
                      const vcName = getPlayerName(t.viceCaptainId);

                      return (
                        <div
                          key={t._id}
                          onClick={() => {
                            if (!isAlreadyJoined) setSelectedTeamId(t._id);
                          }}
                          className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors ${
                            isAlreadyJoined
                              ? "opacity-60 cursor-not-allowed border-border bg-surface-2/30"
                              : isSelected
                                ? "cursor-pointer border-primary bg-primary/10 shadow-sm"
                                : "cursor-pointer border-border bg-surface-2 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-surface text-muted-foreground border border-border"
                              }`}
                            >
                              {isSelected ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                            </span>
                            <div>
                              <span className="block font-display text-xs font-bold text-foreground">
                                {t.name || `Team ${idx + 1}`}
                              </span>
                              <span className="block text-[11px] text-muted-foreground">
                                <b className="text-amber-400">C:</b> {capName} &bull;{" "}
                                <b className="text-cyan-400">VC:</b> {vcName}
                              </span>
                            </div>
                          </div>

                          <div>
                            {isAlreadyJoined ? (
                              <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Joined
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-primary">
                                {t.totalCredits ? t.totalCredits.toFixed(1) : "0.0"} Cr
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Button: Create New Team if all joined / 0 teams, else Join Contest */}
              {teams.length === 0 ||
              teams.filter(
                (t) =>
                  !getJoinedTeamIdsForContest(contestToJoin._id).includes(t._id),
              ).length === 0 ? (
                <Button
                  type="button"
                  onClick={handleCreateTeamForContest}
                  variant="hero"
                  size="xl"
                  className="w-full font-display font-bold tracking-wider gap-2 shadow-lg shadow-primary/20"
                >
                  <Plus className="h-4 w-4" /> CREATE TEAM (TEAM {teams.length + 1}) & JOIN
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={joining || !selectedTeamId}
                  variant="hero"
                  size="xl"
                  className="w-full font-display font-bold tracking-wider"
                >
                  {joining ? "JOINING CONTEST..." : "JOIN CONTEST"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: VIEW MY CONTEST DETAILS & JOINED TEAM */}
      {/* ------------------------------------------------------------- */}
      {viewingContest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/40 bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  {viewingContest.name}
                </h3>
                <p className="text-xs text-muted-foreground">Contest & Team Details</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setViewingContest(null)}
                className="h-8 w-8 rounded-full border border-border"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4">
              {/* Contest Overview */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                    Prize Pool
                  </p>
                  <p className="font-display text-2xl font-black text-primary">
                    {formatPrizeDisplay(viewingContest.prizePool ?? viewingContest.prize)}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={viewingContest.status || "OPEN"} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Max {viewingContest.maxSlots || 5000} spots
                  </p>
                </div>
              </div>

              {/* Joined Team Details */}
              {(() => {
                const teamObj: any = viewingContest.fantasyTeamId;
                const fullTeam =
                  teams.find(
                    (t) => t._id === String(teamObj?._id ?? teamObj ?? ""),
                  ) ?? teamObj;

                const teamName = fullTeam?.name ?? "Team 1";
                const capName = fullTeam?.captainId ? getPlayerName(fullTeam.captainId) : "Player";
                const vcName = fullTeam?.viceCaptainId
                  ? getPlayerName(fullTeam.viceCaptainId)
                  : "Player";

                return (
                  <div className="rounded-xl border border-primary/30 bg-surface-2/60 p-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-muted-foreground">
                          Joined Team
                        </span>
                        <span className="font-display text-base font-bold text-foreground">
                          {teamName}
                        </span>
                      </div>
                      {fullTeam && fullTeam.playerIds && (
                        <Button
                          size="sm"
                          variant="outlineGreen"
                          className="gap-1.5 text-xs font-bold"
                          onClick={() => setPitchPreviewTeam(fullTeam)}
                        >
                          <Eye className="h-3.5 w-3.5" /> PITCH PREVIEW
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 rounded-lg bg-surface p-2.5 border border-border">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[9px] font-extrabold text-black">
                          C
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{capName}</span>
                          <span className="block text-[10px] text-muted-foreground">Captain 2X</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-surface p-2.5 border border-border">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-[8px] font-extrabold text-black">
                          VC
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{vcName}</span>
                          <span className="block text-[10px] text-muted-foreground">Vice-Cap 1.5X</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Actions: View Leaderboard */}
              <div className="pt-2">
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full font-bold gap-2"
                  onClick={() => {
                    setFlow(FLOW_KEYS.selectedContestId, viewingContest._id);
                    navigate({ to: "/leaderboard" });
                  }}
                >
                  <Trophy className="h-4 w-4" /> VIEW LEADERBOARD
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pitch Preview Modal from My Contests */}
      {pitchPreviewTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
            <TeamPitchPreview
              players={getSquadForTeam(pitchPreviewTeam)}
              captainId={String((pitchPreviewTeam.captainId as any)?._id ?? pitchPreviewTeam.captainId ?? "")}
              viceCaptainId={String(
                (pitchPreviewTeam.viceCaptainId as any)?._id ?? pitchPreviewTeam.viceCaptainId ?? "",
              )}
              teamName={pitchPreviewTeam.name}
              totalCredits={pitchPreviewTeam.totalCredits}
              onClose={() => setPitchPreviewTeam(null)}
            />
          </div>
        </div>
      )}
    </AppShell>
  );
}