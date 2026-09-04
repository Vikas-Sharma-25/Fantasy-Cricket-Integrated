import { Router, Request, Response } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import matchRoutes from "./match.routes";
import matchPlayerRoutes from "./matchPlayer.routes";
import teamRoutes from "./team.routes";
import contestRoutes from "./contest.routes";
import leaderboardRoutes from "./leaderboard.routes";
import supportRoutes from "./support.routes";
import adminRoutes from "./admin.routes";
import playerRoutes from "./player.routes";

const router = Router();

router.get("/health", (_req: Request, res: Response) => res.json({ success: true, message: "OK" }));

router.get("/test-email", async (_req: Request, res: Response) => {
  try {
    const nodemailer = require("nodemailer");
    const { env } = require("../config/env");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS.replace(/\s+/g, ""),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"Fantasy Cricket Arena" <${env.SMTP_USER}>`,
      to: "vikass78901@gmail.com",
      subject: "Your Fantasy Cricket OTP Code: 976021",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #10B981; border-radius: 12px; background: #0B0F19; color: #ffffff;">
          <h2 style="color: #10B981; margin-top: 0;">Fantasy Cricket Arena</h2>
          <p style="color: #cbd5e1;">Your verification OTP code for <b>LOGIN</b> is:</p>
          <div style="background: rgba(16,185,129,0.1); border: 2px dashed #10B981; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10B981;">9 7 6 0 2 1</span>
          </div>
          <p style="color: #94a3b8; font-size: 13px;">Valid for 5 minutes. Please do not share this code with anyone.</p>
        </div>`
    });

    res.json({ success: true, message: "Email sent successfully", info, user: env.SMTP_USER });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
      response: err.response,
      responseCode: err.responseCode
    });
  }
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/matches", matchRoutes);
router.use("/match-players", matchPlayerRoutes);
router.use("/teams", teamRoutes);
router.use("/contests", contestRoutes);
router.use("/leaderboards", leaderboardRoutes);
router.use("/support", supportRoutes);
router.use("/admin", adminRoutes);
router.use("/players", playerRoutes);

export default router;