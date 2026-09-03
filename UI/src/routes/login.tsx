import { useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/components/fc/AuthLayout";
import { Field } from "@/components/fc/Field";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/api-services";
import { setFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await loginUser({ email, password });
      setFlow(FLOW_KEYS.pendingRegisterEmail, email);
      navigate({ to: "/verify-otp-login" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Login failed. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AuthLayout title="Welcome Back!" subtitle="Login to your account" footer={<span className="text-muted-foreground">Don't have an account? <Link to="/register" className="font-semibold text-primary underline underline-offset-4">Register</Link></span>}>
      <form onSubmit={submit} className="space-y-4">
        <Field required value={email} onChange={(e) => setEmail(e.target.value)} label="Email" icon={<Mail className="h-3.5 w-3.5" />} type="email" placeholder="Enter email" />
        <div><Field required value={password} onChange={(e) => setPassword(e.target.value)} label="Password" icon={<Lock className="h-3.5 w-3.5" />} type="password" placeholder="Enter your password" /></div>
        {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <Button disabled={loading} type="submit" variant="hero" size="xl" className="w-full">{loading ? "CHECKING..." : "LOGIN"}</Button>
      </form>
    </AuthLayout>
  );
}
