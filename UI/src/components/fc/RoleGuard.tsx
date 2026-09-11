import { ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMe, getCachedUser } from "@/lib/api-services";
import type { User } from "@/lib/api-types";

interface RoleGuardProps {
  allowedRoles: Array<"user" | "admin" | "super_admin">;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
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

  const currentRole = (user?.role || "user") as "user" | "admin" | "super_admin";
  const hasAccess = user && allowedRoles.includes(currentRole);

  if (loading && !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess && (checked || !user)) {
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
            {!user
              ? "You must be signed in with an authorized administrative account to access this area."
              : `Your account (${user.email}) has role "${user.role || "user"}" which does not have permission to view this section.`}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!user ? (
              <Button asChild variant="hero" size="lg" className="font-bold">
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            ) : (
              <Button asChild variant="hero" size="lg" className="font-bold">
                <Link to="/matches">Return to Matches</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

