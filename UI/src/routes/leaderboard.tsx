import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, Tabs } from "@/components/fc/bits";
import { LoadingState, EmptyState, LoadMoreButton } from "@/components/fc/ListState";
import { getLeaderboard } from "@/lib/api-services";
import { getFlow, FLOW_KEYS } from "@/lib/flow";
import { useLoadMore } from "@/hooks/use-load-more";

export const Route = createFileRoute("/leaderboard")({ component: LeaderboardPage });

function LeaderboardPage() {
  const contestId = getFlow<string | null>(FLOW_KEYS.selectedContestId, null);
  const [tab, setTab] = useState("Leaderboard");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { visibleItems, hasMore, loadMore, reset } = useLoadMore(rows, 5);

  useEffect(() => {
    if (!contestId) { setLoading(false); return; }
    setLoading(true); setError("");
    void getLeaderboard(contestId)
      .then((data) => { setRows(data); reset(); })
      .catch((e) => { setError(e.message); setRows([]); })
      .finally(() => setLoading(false));
  }, [contestId]);

  return <AppShell><PageHeader back="/contests" title="Leaderboard" /><Tabs items={["Leaderboard", "My Rank"]} active={tab} onChange={setTab} />
    {!contestId
      ? <Card className="mt-5"><p className="text-sm">Join a contest first to view its leaderboard.</p></Card>
      : loading
      ? <LoadingState label="Loading leaderboard..." />
      : error
      ? <Card className="mt-5"><p className="text-sm text-destructive">{error}</p></Card>
      : <>
          <Card className="mt-5 p-0">
            <div className="grid grid-cols-[56px_1fr_72px] border-b border-border px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"><span>Rank</span><span>User</span><span className="text-right">Points</span></div>
            {visibleItems.map((r, i) => <div key={r._id || r.userId || i} className="grid grid-cols-[56px_1fr_72px] items-center border-b border-border px-4 py-3 text-sm last:border-0"><span className="font-display font-bold">{r.rank ?? i + 1}</span><span className="font-medium">{r.user?.name ?? r.name ?? r.username ?? "Player"}</span><span className="text-right font-display font-bold">{r.points ?? r.totalPoints ?? 0}</span></div>)}
            {!rows.length && <EmptyState label="No entries yet for this contest." />}
          </Card>
          {hasMore && <LoadMoreButton onClick={loadMore} />}
        </>}
  </AppShell>;
}