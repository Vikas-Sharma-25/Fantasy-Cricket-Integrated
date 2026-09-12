import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { getCachedUser } from "@/lib/api-services";
import { setFlow, FLOW_KEYS } from "@/lib/flow";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Only execute check on client side
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const user = getCachedUser();

    if (!token || !user) {
      // Capture the attempted destination to redirect back after login
      const fullPath = pathname + (search ? (search.startsWith("?") ? search : `?${search}`) : "");
      if (fullPath && fullPath !== "/login" && fullPath !== "/register") {
        setFlow("redirectAfterLogin", fullPath);
      }
      setFlow(
        FLOW_KEYS.authPromptMsg,
        "Access Denied: Please log in to your account first to enjoy this service."
      );
      setIsAuthorized(false);
      navigate({ to: "/login" });
    } else {
      setIsAuthorized(true);
    }
  }, [pathname, search, navigate]);

  // While validating authorization state on initial client load
  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-semibold text-muted-foreground">Verifying session...</span>
        </div>
      </div>
    );
  }

  // If redirecting, render nothing to avoid flash of protected UI
  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
