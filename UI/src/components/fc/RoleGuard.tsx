import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMe, getCachedUser } from "@/lib/api-services";
import type { User } from "@/lib/api-types";
import { setFlow, FLOW_KEYS } from "@/lib/flow";

interface RoleGuardProps {
  allowedRoles: Array<"user" | "admin" | "super_admin">;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(() => !getCachedUser());
  const [checked, setChecked] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    getMe()
      .then((freshUser) => {
        if (isMounted) {
          setUser(freshUser);
          setChecked(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setChecked(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // If unauthenticated, redirect immediately to login
  useEffect(() => {
    if (!loading && !user && checked) {
      setFlow("redirectAfterLogin", pathname || "/admin");
      setFlow(
        FLOW_KEYS.authPromptMsg,
        "Access Denied: Please log in with an administrator account to access the admin console."
      );
      navigate({ to: "/login" });
    }
  }, [loading, user, checked, pathname, navigate]);

  const currentRole = (user?.role || "user") as "user" | "admin" | "super_admin";
  const hasAccess = user && allowedRoles.includes(currentRole);

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-xs font-semibold text-muted-foreground">Verifying admin credentials...</span>
        </div>
      </div>
    );
  }

  if (!user && (checked || !loading)) {
    return null; // Redirect is executing
  }

  if (!hasAccess && (checked || user)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-2xl border border-destructive/40 bg-surface p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-black tracking-tight text-foreground">
            Access Restricted
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {user
              ? `Your account (${user.email}) has role "${user.role || "user"}" which does not have permission to view the administrative console.`
              : "Administrative privileges are required to access this area."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="hero" size="lg" className="font-bold">
              <Link to="/matches">Return to Matches</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
