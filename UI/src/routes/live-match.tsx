import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/fc/AppShell";
import { Card, StatusBadge, Tabs } from "@/components/fc/bits";
import { getMatchLive } from "@/lib/api-services";
import { getFlow, FLOW_KEYS } from "@/lib/flow";

export const Route=createFileRoute("/live-match")({component:LiveMatch});
function LiveMatch(){const id=getFlow<string|null>(FLOW_KEYS.selectedMatchId,null);const [tab,setTab]=useState("Live");const [live,setLive]=useState<any>(null);useEffect(()=>{if(id){void getMatchLive(id).then(setLive).catch(()=>{})}},[id]);return <AppShell><PageHeader back="/my-matches" title="Live Match" right={<StatusBadge status={live?.status||"LIVE"}/>}/>{!id?<Card><p className="text-sm">Select a match first.</p></Card>:<><Card><p className="font-display text-lg font-bold">Live match data</p><p className="mt-2 text-sm text-muted-foreground">Status: {live?.status||"Loading..."}</p><pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-surface-2 p-3 text-xs">{JSON.stringify(live?.providerData||{},null,2)}</pre></Card><div className="mt-5"><Tabs items={["Live","Scorecard","Commentary","Fantasy"]} active={tab} onChange={setTab}/></div><Card className="mt-5"><p className="text-sm text-muted-foreground">Real-time scoring events are exposed by the API Socket.IO server. The REST live endpoint currently returns the provider data available for this match.</p></Card></>}</AppShell>}
