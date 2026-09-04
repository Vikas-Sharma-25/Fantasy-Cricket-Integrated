import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/fc/AuthLayout";
import { OtpInput } from "@/components/fc/OtpInput";
import { Button } from "@/components/ui/button";
import { verifyLoginOtp, resendOtp } from "@/lib/api-services";
import { getFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/verify-otp-login")({ component: VerifyOtpLogin });

function VerifyOtpLogin() {
  const navigate = useNavigate();
  const email = getFlow(FLOW_KEYS.pendingRegisterEmail, "your email");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await verifyLoginOtp(otp);
      navigate({ to: "/matches" });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Invalid OTP code");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    try {
      await resendOtp();
      setError("A fresh 6-digit OTP has been sent to your email.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Unable to resend OTP");
    }
  }

  return (
    <AuthLayout
      title="Verify OTP"
      subtitle={`Enter the 6-digit code sent to ${email}`}
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="py-2">
          <OtpInput value={otp} onChange={setOtp} length={6} autoFocus />
        </div>

        {error && (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive text-center">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Didn't receive code?</span>
          <button
            type="button"
            onClick={resend}
            className="font-bold text-primary hover:underline"
          >
            Resend OTP
          </button>
        </div>

        <Button
          disabled={loading || otp.length < 6}
          type="submit"
          variant="hero"
          size="xl"
          className="w-full font-bold tracking-wide flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          VERIFY OTP
        </Button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back to Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

