import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In production, socket connects to window.location.origin (Nginx routes /socket.io)
    const url = typeof window !== "undefined" ? window.location.origin : "http://localhost:5000";
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || undefined : undefined;

    socket = io(url, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}
