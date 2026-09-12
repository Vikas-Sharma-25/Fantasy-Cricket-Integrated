import { useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "@/components/fc/AuthLayout";
import { Field } from "@/components/fc/Field";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/api-services";
import { setFlow, getFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const authPrompt = getFlow<string>(FLOW_KEYS.authPromptMsg, "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      setFlow(FLOW_KEYS.pendingRegisterEmail, email);
      if (res?.otpToken) {
        setFlow(FLOW_KEYS.otpToken, res.otpToken);
      }
      navigate({ to: "/verify-otp-login" });
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Login to your account"
      footer={
        <span className="text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary underline underline-offset-4">
            Register
          </Link>
        </span>
      }
    >
      {authPrompt && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <div className="flex-1">
            <p className="font-bold text-[13px]">Notice</p>
            <p className="mt-0.5 text-foreground/80 leading-relaxed">{authPrompt}</p>
          </div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-4">
        <Field
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          label="Email"
          icon={<Mail className="h-3.5 w-3.5" />}
          type="email"
          placeholder="Enter email"
        />
        <div>
          <Field
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            icon={<Lock className="h-3.5 w-3.5" />}
            type="password"
            placeholder="Enter your password"
          />
        </div>
        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          disabled={loading}
          type="submit"
          variant="hero"
          size="xl"
          className="w-full flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          LOGIN
        </Button>
      </form>
    </AuthLayout>
  );
}
