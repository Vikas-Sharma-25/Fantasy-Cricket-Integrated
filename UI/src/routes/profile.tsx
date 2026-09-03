import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Bell, ChevronRight, Users, Trophy, Receipt, Gift, Settings, LifeBuoy } from "lucide-react";
import { AppShell } from "@/components/fc/AppShell";
import { Card } from "@/components/fc/bits";
import { getMe, logoutUser } from "@/lib/api-services";
import type { User } from "@/lib/api-types";

export const Route = createFileRoute("/profile")({ component: Profile });
const menu=[{icon:Users,label:"My Teams",to:"/create-team"},{icon:Trophy,label:"My Contests",to:"/contests"},{icon:Receipt,label:"Results",to:"/results"},{icon:Gift,label:"Refer & Earn",to:"/matches"},{icon:Bell,label:"Notifications",to:"/matches"},{icon:Settings,label:"Settings",to:"/admin"},{icon:LifeBuoy,label:"Help & Support",to:"/matches"}];
function Profile(){const navigate=useNavigate();const [user,setUser]=useState<User|null>(null);useEffect(()=>{void getMe().then(setUser).catch(()=>{})},[]);async function logout(){await logoutUser();navigate({to:"/login"});}return <AppShell><Card className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full gradient-primary font-display text-lg font-bold text-primary-foreground">{(user?.name||"U").slice(0,2).toUpperCase()}</span><div><p className="font-display text-lg font-bold">{user?.name||"Loading..."}</p><p className="text-xs text-muted-foreground">{user?.email||""}</p></div></Card><Card className="mt-4 p-0">{menu.map(({icon:Icon,label,to})=><Link key={label} to={to} className="flex items-center gap-3 border-b border-border px-4 py-4 text-sm last:border-0 hover:bg-surface-2"><Icon className="h-4 w-4 text-primary"/><span className="flex-1 font-medium">{label}</span><ChevronRight className="h-4 w-4 text-muted-foreground"/></Link>)}</Card><button onClick={()=>void logout()} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-4 text-sm font-semibold text-destructive"><LogOut className="h-4 w-4"/> Logout</button></AppShell>}
