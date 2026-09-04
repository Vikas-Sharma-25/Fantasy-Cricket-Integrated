import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { globalLimiter } from "./middleware/rateLimiter.middleware";

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl) or all vercel/localhost origins
        if (
          !origin ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1") ||
          origin.endsWith(".vercel.app") ||
          origin.includes("render.com") ||
          env.CLIENT_URL.includes(origin) ||
          env.NODE_ENV === "development"
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
  app.use(globalLimiter);

  app.use("/api", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  

  return app;
}
