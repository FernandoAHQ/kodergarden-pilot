import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@kodergarden/shared";

export type LiveSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
export const createLiveSocket = (): LiveSocket => {
  const configuredServer = import.meta.env.VITE_LIVE_SERVER_URL?.trim();
  return io(configuredServer || undefined, { autoConnect: true, reconnection: true });
};
