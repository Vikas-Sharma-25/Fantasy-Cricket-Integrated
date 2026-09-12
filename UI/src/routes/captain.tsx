import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, Pencil, Save, CheckCircle2, Trophy, Users, X, AlertCircle } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { LoadingState } from "@/components/fc/ListState";
import { Button } from "@/components/ui/button";
import { TeamPitchPreview } from "@/components/fc/TeamPitchPreview";
import { getMatchPlayers, createTeam, updateTeam, getContests, joinContest, getLocalWalletBalance, deductLocalWallet } from "@/lib/api-services";
import type { MatchPlayer, Contest } from "@/lib/api-types";
import { getFlow, setFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/captain")({ component: Captain });

function Captain() {
  const navigate = useNavigate();
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const editingTeamId = getFlow<string | null>(FLOW_KEYS.editingTeamId, null);
  const rawIds = getFlow<any[]>(FLOW_KEYS.selectedPlayerIds, []);
  const ids = Array.from(new Set((rawIds ?? []).map((x) => String(x?._id ?? x?.playerId ?? x))));
  const name = getFlow<string>(FLOW_KEYS.selectedTeamName, "My Team");
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [cap, setCap] = useState(getFlow(FLOW_KEYS.captainId, ""));
  const [vice, setVice] = useState(getFlow(FLOW_KEYS.viceCaptainId, ""));
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Contest join confirmation prompt state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [savedTeamId, setSavedTeamId] = useState<string>("");
  const [availableContests, setAvailableContests] = useState<Contest[]>([]);
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [joiningContest, setJoiningContest] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);
  const [joinError, setJoinError] = useState("");

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
        removeFlow(FLOW_KEYS.editingTeamId);
        removeFlow(FLOW_KEYS.selectedPlayerIds);
        removeFlow(FLOW_KEYS.captainId);
        removeFlow(FLOW_KEYS.viceCaptainId);
        if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
        setFlow("OPEN_MATCH_TAB", "Contests");
        setFlow("OPEN_CONTEST_SUBTAB", "myTeams");
        navigate({ to: "/matches" });
        return;
      }

      // Create new team
      const created = await createTeam({
        matchId,
        name,
        playerIds: ids,
        captainId: cap,
        viceCaptainId: vice,
      });

      removeFlow(FLOW_KEYS.editingTeamId);
      removeFlow(FLOW_KEYS.selectedPlayerIds);
      removeFlow(FLOW_KEYS.captainId);
      removeFlow(FLOW_KEYS.viceCaptainId);

      // Check if user came from a specific contest
      const returnContestId = getFlow<string | null>(FLOW_KEYS.returnToContestId, null);
      if (returnContestId) {
        removeFlow(FLOW_KEYS.returnToContestId);
        setFlow(FLOW_KEYS.pendingJoinContestId, returnContestId);
        setFlow(FLOW_KEYS.pendingJoinTeamId, created._id);
        setFlow(FLOW_KEYS.pendingJoinTeamName, created.name || name);
        if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
        setFlow("OPEN_MATCH_TAB", "Contests");
        setFlow("OPEN_CONTEST_SUBTAB", "contests");
        navigate({ to: "/matches" });
        return;
      }

      // If created normally, navigate back to Match Center
      if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
      setFlow("OPEN_MATCH_TAB", "Contests");
      setFlow("OPEN_CONTEST_SUBTAB", "myTeams");
      navigate({ to: "/matches" });
      return;
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Unable to save team");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmJoinContest() {
    if (!selectedContestId || !savedTeamId) return;

    const contestObj = availableContests.find((c) => c._id === selectedContestId);
    const fee = typeof contestObj?.entryFee === "number" ? contestObj.entryFee : (contestObj?.rules?.entryFee ?? 0);
    const currentBal = getLocalWalletBalance();

    if (fee > 0 && currentBal < fee) {
      setJoinError("You don't have sufficient money to join contest. Please add money to your wallet.");
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "fc_wallet_insufficient_notice",
          `You need at least ₹${fee} to join "${contestObj?.name || "the contest"}". Please add funds to your wallet.`
        );
        setTimeout(() => {
          navigate({ to: "/wallet" });
        }, 2200);
      }
      return;
    }

    setJoiningContest(true);
    setJoinError("");

    try {
      await joinContest(selectedContestId, savedTeamId);
      deductLocalWallet(fee, contestObj?.name || "Contest Entry");
      setFlow(FLOW_KEYS.selectedContestId, selectedContestId);
      setJoinSuccess(true);
    } catch (e: any) {
      const msg = e instanceof ApiClientError ? e.message : (e?.message || "Failed to join contest");
      if (msg.includes("INSUFFICIENT_WALLET_BALANCE") || msg.toLowerCase().includes("sufficient money")) {
        setJoinError("You don't have sufficient money to join contest. Please add money to your wallet.");
        if (typeof window !== "undefined") {
          sessionStorage.setItem("fc_wallet_insufficient_notice", "You don't have sufficient money to join contest. Please add money to your wallet.");
          setTimeout(() => {
            navigate({ to: "/wallet" });
          }, 2200);
        }
      } else {
        setJoinError(msg);
      }
    } finally {
      setJoiningContest(false);
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
          <Save className="h-4 w-4" />{" "}
          {saving
            ? "SAVING..."
            : editingTeamId
            ? "SAVE CHANGES"
            : getFlow<string | null>(FLOW_KEYS.returnToContestId, null)
            ? `NEXT → JOIN CONTEST (${name})`
            : "SAVE TEAM"}
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

      {/* Join Contest Confirmation Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/40 bg-surface shadow-2xl">
            {joinSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  Contest Joined Successfully! 🎉
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your fantasy team <span className="font-bold text-primary">{name}</span> has been entered into the contest!
                </p>
                <div className="pt-3">
                  <Button
                    type="button"
                    variant="hero"
                    size="xl"
                    className="w-full font-bold shadow-lg shadow-primary/25"
                    onClick={() => {
                      setShowJoinModal(false);
                      navigate({ to: "/contests" });
                      removeFlow(FLOW_KEYS.returnToContestId);
                      if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
                      navigate({ to: "/matches" });
                    }}
                  >
                    VIEW IN MY CONTESTS
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                      ✓
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-bold text-foreground">
                        Team Saved Successfully!
                      </h3>
                      <p className="text-[11px] text-muted-foreground">Choose a contest to join</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowJoinModal(false);
                      navigate({ to: "/create-team" });
                      removeFlow(FLOW_KEYS.returnToContestId);
                      if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
                      navigate({ to: "/matches" });
                    }}
                    className="h-8 w-8 rounded-full border border-border"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Would you like to enter a contest with <b className="text-foreground">{name}</b> right now?
                  </p>

                  {/* Contest Selection List */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {availableContests.map((c) => {
                      const isSelected = selectedContestId === c._id;
                      const isFree = !c.entryFee || c.entryFee === 0;
                      const prizeStr = typeof c.prizePool === "number" ? `₹${c.prizePool.toLocaleString()}` : (c.prize || "₹10,00,000");

                      return (
                        <div
                          key={c._id}
                          onClick={() => setSelectedContestId(c._id)}
                          className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border bg-surface-2 hover:border-primary/50"
                          }`}
                        >
                          <div>
                            <span className="block font-display text-xs font-bold text-foreground">
                              {c.name}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              Prize Pool: <b className="text-primary">{prizeStr}</b>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="rounded bg-surface px-2 py-0.5 text-xs font-bold text-primary border border-border">
                              {isFree ? "FREE" : `₹${c.entryFee}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {availableContests.length === 0 && (
                      <p className="text-center py-4 text-xs text-muted-foreground">
                        Mega Contest will be available shortly.
                      </p>
                    )}
                  </div>

                  {joinError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2 text-xs">
                      <p className="text-destructive font-bold flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{joinError}</span>
                      </p>
                      {(joinError.includes("sufficient money") || joinError.includes("wallet")) && (
                        <Button
                          type="button"
                          onClick={() => {
                            setShowJoinModal(false);
                            navigate({ to: "/wallet" });
                          }}
                          variant="hero"
                          size="sm"
                          className="w-full text-xs font-bold py-1.5"
                        >
                          Add Money to Wallet Now
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setShowJoinModal(false);
                        navigate({ to: "/create-team" });
                        removeFlow(FLOW_KEYS.returnToContestId);
                        if (matchId) setFlow(FLOW_KEYS.selectedMatchId, matchId);
                        navigate({ to: "/matches" });
                      }}
                      className="border-border bg-surface text-xs font-semibold hover:bg-surface-2"
                    >
                      SKIP FOR NOW
                    </Button>
                    <Button
                      type="button"
                      variant="hero"
                      size="lg"
                      disabled={joiningContest || !selectedContestId}
                      onClick={handleConfirmJoinContest}
                      className="text-xs font-bold"
                    >
                      {joiningContest ? "JOINING..." : "JOIN CONTEST NOW"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}