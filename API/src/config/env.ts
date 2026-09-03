import dotenv from "dotenv";
dotenv.config();

function get(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
}

export const env = {
  NODE_ENV: get("NODE_ENV", "development"),
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: get("CLIENT_URL", "http://localhost:8080"),

  MONGO_URI: get("MONGO_URI", "mongodb://127.0.0.1:27017/fantasy_cricket"),

  JWT_ACCESS_SECRET: get("JWT_ACCESS_SECRET", "dev_access_secret_change_me"),
  JWT_REFRESH_SECRET: get("JWT_REFRESH_SECRET", "dev_refresh_secret_change_me"),
  JWT_ACCESS_EXPIRES_IN: get("JWT_ACCESS_EXPIRES_IN", "2d"),
  JWT_REFRESH_EXPIRES_IN: get("JWT_REFRESH_EXPIRES_IN", "7d"),

  OTP_LENGTH: Number(process.env.OTP_LENGTH) || 6,
  OTP_EXPIRES_IN_MINUTES: Number(process.env.OTP_EXPIRES_IN_MINUTES) || 5,
  OTP_RESEND_COOLDOWN_SECONDS: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 30,
  OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
  OTP_MAX_RESEND_PER_WINDOW: Number(process.env.OTP_MAX_RESEND_PER_WINDOW) || 5,

  MAIL_FROM: get("MAIL_FROM", "vikass78901@gmail.com"),
  SMTP_HOST: get("SMTP_HOST", "smtp.gmail.com"),
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: get("SMTP_USER", "vikass78901@gmail.com"),
  SMTP_PASS: get("SMTP_PASS", "lwvrqtwrvxczfnvh"),
  SMTP_SECURE: get("SMTP_SECURE", "false") === "true",

  CRICKET_PROVIDER_BASE_URL: get("CRICKET_PROVIDER_BASE_URL", ""),
  CRICKET_PROVIDER_API_KEY: get("CRICKET_PROVIDER_API_KEY", ""),

  RATE_LIMIT_WINDOW_MINUTES: Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 2000
};
