import { useState, useEffect, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/fc/AuthLayout";
import { OtpInput } from "@/components/fc/OtpInput";
import { Button } from "@/components/ui/button";
import { verifyAccount, resendOtp } from "@/lib/api-services";
import { getFlow, setFlow, FLOW_KEYS } from "@/lib/flow";
import { ApiClientError } from "@/lib/api";

export const Route = createFileRoute("/verify-otp")({ component: VerifyOtp });

function VerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const email = getFlow(FLOW_KEYS.pendingRegisterEmail, "your email");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const otpToken = getFlow<string | undefined>(FLOW_KEYS.otpToken, undefined);
      await verifyAccount(otp, otpToken);
      setFlow(
        FLOW_KEYS.authPromptMsg,
        "Account verified successfully! Please log in to your account to access your fantasy dashboard."
      );
      navigate({ to: "/login" });
    } catch (err: any) {
      setError(err?.message || (err instanceof ApiClientError ? err.message : "Invalid OTP code"));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (countdown > 0 || resending) return;
    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      const currentToken = getFlow<string | undefined>(FLOW_KEYS.otpToken, undefined);
      const res = await resendOtp(currentToken);
      if (res?.otpToken) {
        setFlow(FLOW_KEYS.otpToken, res.otpToken);
      }
      setSuccessMsg("A fresh 6-digit OTP has been sent to your registered email.");
      setCountdown(30);
    } catch (err: any) {
      setError(err?.message || (err instanceof ApiClientError ? err.message : "Unable to resend OTP"));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout
      title="Verify Account"
      subtitle={`Enter the 6-digit verification code sent to ${email}`}
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

        {successMsg && (
          <p className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary text-center">
            {successMsg}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Didn't receive code?</span>
          <button
            type="button"
            disabled={countdown > 0 || resending}
            onClick={resend}
            className="font-bold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {resending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" /> Sending...
              </>
            ) : countdown > 0 ? (
              `Resend OTP in ${countdown}s`
            ) : (
              "Resend OTP"
            )}
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
          VERIFY & CONTINUE
        </Button>

        <div className="text-center">
          <Link
            to="/register"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Change Email
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

