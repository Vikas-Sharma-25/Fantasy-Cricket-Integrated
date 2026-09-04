import { useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Phone, Lock, User, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/fc/AuthLayout";
import { Field } from "@/components/fc/Field";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/api-services";
import { setFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser({ ...form, mobile: form.mobile || undefined });
      setFlow(FLOW_KEYS.pendingRegisterEmail, form.email);
      navigate({ to: "/verify-otp" });
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join the best fantasy cricket platform"
      footer={
        <span className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
            Login
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field
          required
          value={form.name}
          onChange={update("name")}
          label="Full Name"
          icon={<User className="h-3.5 w-3.5" />}
          placeholder="Enter your full name"
        />
        <Field
          required
          value={form.email}
          onChange={update("email")}
          label="Email"
          icon={<Mail className="h-3.5 w-3.5" />}
          type="email"
          placeholder="Enter your email"
        />
        <Field
          value={form.mobile}
          onChange={update("mobile")}
          label="Mobile Number"
          icon={<Phone className="h-3.5 w-3.5" />}
          placeholder="Enter your mobile number"
        />
        <Field
          required
          minLength={6}
          value={form.password}
          onChange={update("password")}
          label="Password"
          icon={<Lock className="h-3.5 w-3.5" />}
          type="password"
          placeholder="Create a password"
        />
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
          REGISTER
        </Button>
      </form>
    </AuthLayout>
  );
}
