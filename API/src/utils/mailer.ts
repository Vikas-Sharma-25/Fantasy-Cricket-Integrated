import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "./logger";

/**
 * Real SMTP mailer via nodemailer. If SMTP_HOST/USER/PASS are not set in
 * .env, falls back to logging the email to the console so the flow still
 * works without any mail account configured.
 */
let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    return null; // not configured -> caller falls back to console mock
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS.replace(/\s+/g, ""),
      },
    });
  }
  return transporter;
}

async function dispatchEmail(to: string, subject: string, html: string, text: string) {
  const mailer = getTransporter();

  if (!mailer) {
    logger.warn("[mailer] SMTP not configured - OTP was printed to console above");
    return;
  }

  try {
    await mailer.sendMail({
      from: env.MAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    console.log(`✅ [mailer] Email delivered successfully via SMTP to: ${to}`);
    logger.info("[mailer] Email sent", { to, subject });
  } catch (err: any) {
    console.error(`⚠️ [mailer] SMTP delivery failed (${err.message}). OTP is still valid and logged to terminal above.`);
    logger.error("[mailer] SMTP send failed", err);
  }
}

export async function sendOtpEmail(to: string, otp: string, purpose: string): Promise<void> {
  // Always log the OTP to the terminal console immediately
  console.log(`\n=======================================================`);
  console.log(`🔑 [FANTASY CRICKET OTP]`);
  console.log(`📧 To: ${to}`);
  console.log(`🎯 Purpose: ${purpose.toUpperCase()}`);
  console.log(`👉 OTP CODE: >>> ${otp} <<<`);
  console.log(`⏳ Valid for: ${env.OTP_EXPIRES_IN_MINUTES} minutes`);
  console.log(`=======================================================\n`);

  const subject = `Your Fantasy Cricket OTP Code: ${otp}`;
  const text = `Your OTP is: ${otp}\nValid for ${env.OTP_EXPIRES_IN_MINUTES} minutes. Do not share it with anyone.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #10B981; border-radius: 12px; background: #0B0F19; color: #ffffff;">
      <h2 style="color: #10B981; margin-top: 0;">Fantasy Cricket Arena</h2>
      <p style="color: #cbd5e1;">Your verification OTP code for <b>${purpose}</b> is:</p>
      <div style="background: rgba(16,185,129,0.1); border: 2px dashed #10B981; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10B981;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 13px;">Valid for ${env.OTP_EXPIRES_IN_MINUTES} minutes. Please do not share this code with anyone.</p>
    </div>`;
  await dispatchEmail(to, subject, html, text);
}

export async function sendOtpSms(mobile: string, otp: string, purpose: string): Promise<void> {
  // SMS gateway (Twilio/MSG91/etc.) not wired up yet - log for now.
  logger.info(`[mailer] Sending OTP SMS (mock)`, { mobile, purpose });
  console.log(`\n===== OTP SMS (MOCK) =====`);
  console.log(`To: ${mobile}`);
  console.log(`Purpose: ${purpose}`);
  console.log(`OTP: ${otp} (valid ${env.OTP_EXPIRES_IN_MINUTES} min)`);
  console.log(`===========================\n`);
}

export async function sendGenericEmail(to: string, subject: string, body: string): Promise<void> {
  await dispatchEmail(to, subject, `<p>${body}</p>`, body);
}