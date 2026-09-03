import http from "http";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { initSockets } from "./sockets";
import { env } from "./config/env";
import { logger } from "./utils/logger";

async function bootstrap() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  initSockets(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`[server] Fantasy Cricket API listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("[server] Unhandled rejection", { reason });
  });
  process.on("uncaughtException", (err) => {
    logger.error("[server] Uncaught exception", { message: err.message, stack: err.stack });
    process.exit(1);
  });
}

bootstrap();
