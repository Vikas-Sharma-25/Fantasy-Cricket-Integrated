import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/fc/AppShell";
import { Card, TeamBadge, Tabs, StatusBadge } from "@/components/fc/bits";
import { LoadingState, EmptyState, LoadMoreButton } from "@/components/fc/ListState";
import { Button } from "@/components/ui/button";
import { getMatches, getMyTeams, getMyContests } from "@/lib/api-services";
import type { Match } from "@/lib/api-types";
import { setFlow, FLOW_KEYS } from "@/lib/flow";
import { useLoadMore } from "@/hooks/use-load-more";

export const Route = createFileRoute("/my-matches")({ component: MyMatches });

interface MyMatchItem {
  match: Match;
  teamCount: number;
  contestCount: number;
}

function MyMatches() {
  const [tab, setTab] = useState("Upcoming");
  const [items, setItems] = useState<MyMatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { visibleItems, hasMore, loadMore, reset } = useLoadMore(items, 5);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      try {
        const ms = await getMatches(
          tab === "Live" ? "LIVE" : tab === "Completed" ? "COMPLETED" : "UPCOMING"
        );
        const results = (
          await Promise.all(
            ms.map(async (m) => {
              try {
                const [teams, contests] = await Promise.all([
                  getMyTeams(m._id).catch(() => []),
                  getMyContests(m._id).catch(() => []),
                ]);
                if (teams.length > 0 || contests.length > 0) {
                  return {
                    match: m,
                    teamCount: teams.length,
                    contestCount: contests.length,
                  };
                }
              } catch {
                // continue
              }
              return null;
            })
          )
        ).filter(Boolean) as MyMatchItem[];

        if (active) {
          setItems(results);
          reset();
        }
      } catch {
        if (active) setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [tab]);

  const handleGoContests = (matchId: string) => {
    setFlow(FLOW_KEYS.selectedMatchId, matchId);
    setFlow("contests_default_tab", "My Contests");
    setFlow("contests_from_my_matches", true);
  };

  return (
    <AppShell>
      <h1 className="mb-5 font-display text-xl font-bold">My Matches</h1>
      <Tabs items={["Upcoming", "Live", "Completed"]} active={tab} onChange={setTab} />
      <div className="mt-5 space-y-4">
        {loading && <LoadingState label="Loading your matches..." />}
        {!loading &&
          visibleItems.map(({ match: m, teamCount, contestCount }) => (
            <Card key={m._id} className="p-0 overflow-hidden">
              <Link
                to="/contests"
                search={{ matchId: m._id, tab: "my-contests", from: "my-matches" }}
                onClick={() => handleGoContests(m._id)}
                className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-2/50 hover:bg-surface-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <TeamBadge team={m.teamA} size={36} />
                  <span className="font-display text-sm font-bold text-foreground">
                    {m.teamA} vs {m.teamB}
                  </span>
                  <TeamBadge team={m.teamB} size={36} />
                </div>
                <StatusBadge status={m.status} />
              </Link>
              <p className="px-4 py-2.5 text-xs text-muted-foreground">
                {new Date(m.startTime).toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-3 border-t border-border bg-surface-2/30 p-4">
                <Button
                  asChild
                  variant="outlineGreen"
                  size="xl"
                  className="font-display text-sm font-extrabold tracking-wider"
                  onClick={() => setFlow(FLOW_KEYS.selectedMatchId, m._id)}
                >
                  <Link
                    to="/my-teams"
                    search={{ matchId: m._id }}
                    onClick={() => setFlow(FLOW_KEYS.selectedMatchId, m._id)}
                  >
                    {teamCount} {teamCount === 1 ? "TEAM" : "TEAMS"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="hero"
                  size="xl"
                  className="font-display text-sm font-extrabold tracking-wider shadow-lg"
                  onClick={() => handleGoContests(m._id)}
                >
                  <Link
                    to="/contests"
                    search={{ matchId: m._id, tab: "my-contests", from: "my-matches" }}
                    onClick={() => handleGoContests(m._id)}
                  >
                    {contestCount} {contestCount === 1 ? "CONTEST" : "CONTESTS"}
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        {!loading && !items.length && (
          <EmptyState label="You have no matches in this category yet." />
        )}
        {!loading && hasMore && <LoadMoreButton onClick={loadMore} />}
      </div>
    </AppShell>
  );
}