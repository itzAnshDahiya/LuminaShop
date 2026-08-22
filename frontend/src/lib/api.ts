import axios from "axios";
import { SendMessageResult } from "@/types";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 120000, // 2-minute timeout for slow Ollama inference
});

/**
 * Send a chat message and receive the agent's response.
 */
export async function sendMessage(
  message: string,
  sessionId: string | null
): Promise<SendMessageResult> {
  const { data } = await api.post<SendMessageResult>("/chat", {
    message,
    sessionId,
  });
  return data;
}

/**
 * Load an existing session by ID.
 */
export async function loadSession(sessionId: string) {
  const { data } = await api.get(`/session/${sessionId}`);
  return data;
}

/**
 * Clear a session (reset cart and messages).
 */
export async function clearSession(sessionId: string) {
  const { data } = await api.delete(`/session/${sessionId}`);
  return data;
}

export async function updateSessionCart(sessionId: string, cart: unknown[]) {
  const { data } = await api.patch(`/session/${sessionId}/cart`, { cart });
  return data;
}

export default api;
