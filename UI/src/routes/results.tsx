import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Share2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { Button } from "@/components/ui/button";
import { getLeaderboard, getContests, getMe } from "@/lib/api-services";
import { getFlow, FLOW_KEYS } from "@/lib/flow";

export const Route = createFileRoute("/results")({ component: Results });

function Results() {
  const contestId = getFlow<string | null>(FLOW_KEYS.selectedContestId, null);
  const matchId = getFlow<string | null>(FLOW_KEYS.selectedMatchId, null);
  const [row, setRow] = useState<any>(null);
  const [contest, setContest] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }
    (async () => {
      try {
        const [rows, me, contests] = await Promise.all([
          getLeaderboard(contestId),
          getMe(),
          matchId ? getContests(matchId) : Promise.resolve([]),
        ]);
        setTotal(rows.length);
        setRow(rows.find((r: any) => r.userId === me._id || r.user?._id === me._id) ?? null);
        setContest(contests.find((c: any) => c._id === contestId) ?? null);
      } catch { /* leave empty state */ }
      finally { setLoading(false); }
    })();
  }, [contestId, matchId]);

  if (loading) return <AppShell><p className="py-16 text-center text-sm text-muted-foreground">Loading result...</p></AppShell>;
  if (!contestId || !row) return <AppShell><Card><p className="text-sm">No result available yet.</p><Button asChild variant="hero" className="mt-4"><Link to="/matches">BACK TO MATCHES</Link></Button></Card></AppShell>;

  return (
    <AppShell>
      <PageHeader back="/leaderboard" title="Result" right={<Share2 className="ml-auto h-4 w-4" />} />
      <Card className="relative overflow-hidden text-center">
        <div className="relative py-6">
          <h2 className="font-display text-2xl font-extrabold">Congratulations!</h2>
          <p className="mt-2 text-sm text-muted-foreground">You finished in</p>
          <p className="mt-3 font-display text-7xl font-extrabold text-primary">#{row.rank}</p>
          <Trophy className="mx-auto mt-4 h-14 w-14 text-accent" />
          <p className="mt-5 text-sm text-muted-foreground">Your Points</p>
          <p className="font-display text-3xl font-extrabold">{row.points ?? row.totalPoints ?? 0}</p>
        </div>
      </Card>
      <Card className="mt-4 p-0">
        {[
          ["Contest", contest?.name ?? "Contest"],
          ["Entries", String(total)],
          ["Your Points", String(row.points ?? row.totalPoints ?? 0)],
          ["Entry Fee", contest?.entryFee ? `₹${contest.entryFee}` : "FREE"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between border-b border-border px-4 py-3 text-sm last:border-0">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </Card>
      <div className="mt-6 space-y-3">
        <Button asChild variant="hero" size="xl" className="w-full"><Link to="/profile">VIEW DETAILS</Link></Button>
        <Button asChild variant="outline" size="xl" className="w-full border-border bg-surface"><Link to="/matches">BACK TO HOME</Link></Button>
      </div>
    </AppShell>
  );
}