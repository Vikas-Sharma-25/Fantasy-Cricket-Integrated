import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/token";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let io: Server | null = null;

/**
 * Initializes Socket.IO on top of the HTTP server.
 * Client connects with `auth: { token }` (JWT access token) to join their
 * personal room; contest/match rooms are joined explicitly via events.
 */
export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true
    }
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(); // allow anonymous connections for public match/contest rooms
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
    } catch {
      // invalid token -> treat as anonymous rather than rejecting the connection
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string | undefined;
    if (userId) {
      socket.join(userRoom(userId));
    }
    logger.info("[socket] client connected", { socketId: socket.id, userId });

    socket.on("contest:subscribe", (contestId: string) => {
      socket.join(contestRoom(contestId));
    });

    socket.on("contest:unsubscribe", (contestId: string) => {
      socket.leave(contestRoom(contestId));
    });

    socket.on("match:subscribe", (matchId: string) => {
      socket.join(matchRoom(matchId));
    });

    socket.on("match:unsubscribe", (matchId: string) => {
      socket.leave(matchRoom(matchId));
    });

    socket.on("disconnect", () => {
      logger.info("[socket] client disconnected", { socketId: socket.id });
    });
  });

  return io;
}

function userRoom(userId: string) {
  return `user:${userId}`;
}
function contestRoom(contestId: string) {
  return `contest:${contestId}`;
}
function matchRoom(matchId: string) {
  return `match:${matchId}`;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(userRoom(userId)).emit(event, payload);
}

export function emitToContest(contestId: string, event: string, payload: unknown) {
  io?.to(contestRoom(contestId)).emit(event, payload);
}

export function emitToMatch(matchId: string, event: string, payload: unknown) {
  io?.to(matchRoom(matchId)).emit(event, payload);
}

export function broadcastAnnouncement(payload: unknown) {
  io?.emit("admin:announcement", payload);
}

export function getIO(): Server | null {
  return io;
}
