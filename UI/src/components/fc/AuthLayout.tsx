import { useEffect, useState, type ReactNode } from "react";
import authSide from "@/assets/hero-cricket.jpg";
import { Logo } from "./Logo";
import { getFlow, removeFlow, FLOW_KEYS } from "@/lib/flow";
import { Info, Sparkles } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  const [promptMsg, setPromptMsg] = useState<string>("");

  useEffect(() => {
    const msg = getFlow<string>(FLOW_KEYS.authPromptMsg, "");
    if (msg) {
      setPromptMsg(msg);
      // Remove so it doesn't linger indefinitely
      removeFlow(FLOW_KEYS.authPromptMsg);
    }
  }, []);

  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-background lg:grid-cols-[1.1fr_1fr]">
      {/* Visual panel (Static, crisp, visible image without text overlay or cursor zoom) */}
      <aside className="relative hidden overflow-hidden lg:block border-r border-border/80 bg-black pointer-events-none select-none">
        <img
          src={authSide}
          alt="High definition cricket action under stadium lights"
          className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
        />
        {/* Subtle vignette edges so image is bright and crisp */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40 pointer-events-none" />
        
        {/* Top Floating Logo */}
        <div className="relative z-10 p-8 pointer-events-auto">
          <div className="inline-block rounded-xl bg-background/60 backdrop-blur-md px-4 py-2 border border-white/10 shadow-lg">
            <Logo size="md" />
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-6">
          <div className="mb-6 lg:hidden">
            <Logo size="md" />
          </div>

          {/* Friendly prompt message from Landing page if triggered */}
          {promptMsg && (
            <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-xs font-semibold text-primary shadow-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
              <div className="flex-1 leading-relaxed">{promptMsg}</div>
            </div>
          )}

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary mb-3">
              <Sparkles className="h-3 w-3" /> FANTASY CRICKET ARENA
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-surface/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
            {children}
          </div>

          {footer ? <div className="text-center text-sm">{footer}</div> : null}
        </div>
      </section>
    </main>
  );
}

