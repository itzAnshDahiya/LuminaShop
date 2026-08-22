import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ChatMessage, ChatState, CartItem } from "@/types";
import { sendMessage, clearSession, loadSession, updateSessionCart } from "@/lib/api";

const STORAGE_KEY = "luminashop_session_id";

function getStoredSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeSessionId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function useChat() {
  const hasHydratedSession = useRef(false);
  const [state, setState] = useState<ChatState>({
    sessionId: getStoredSessionId(),
    messages: [],
    cart: [],
    isLoading: false,
    checkedOut: false,
    stripeUrl: null,
    error: null,
  });

  useEffect(() => {
    if (hasHydratedSession.current) return;
    hasHydratedSession.current = true;
    if (!state.sessionId) return;

    let active = true;
    loadSession(state.sessionId)
      .then((session) => {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          messages: (session.messages || []).map((message: { role: "user" | "assistant"; content: string; timestamp?: string }, index: number) => ({
            id: `${session.id}-${index}`,
            role: message.role,
            content: message.content,
            timestamp: new Date(message.timestamp || Date.now()),
          })),
          cart: session.cart || [],
          checkedOut: session.checkedOut || false,
          stripeUrl: session.stripeUrl || null,
        }));
      })
      .catch(() => {
        if (active) localStorage.removeItem(STORAGE_KEY);
      });

    return () => {
      active = false;
    };
  }, [state.sessionId]);

  const sendChat = useCallback(
    async (text: string) => {
      if (!text.trim() || state.isLoading) return;

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        isLoading: true,
        error: null,
      }));

      try {
        const result = await sendMessage(text.trim(), state.sessionId);

        // Persist session ID
        if (result.sessionId) {
          storeSessionId(result.sessionId);
        }

        // Build assistant message
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content: result.response?.text || "",
          timestamp: new Date(),
          response: result.response,
        };

        const updatedCart: CartItem[] = result.cart || state.cart;

        setState((prev) => ({
          ...prev,
          sessionId: result.sessionId,
          messages: [...prev.messages, assistantMessage],
          cart: updatedCart,
          isLoading: false,
          checkedOut: result.checkedOut || false,
          stripeUrl: result.stripeUrl || prev.stripeUrl,
          error: null,
        }));
      } catch (error: unknown) {
        console.error("[useChat] Error:", error);

        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please make sure the backend and Ollama are running, then try again.",
          timestamp: new Date(),
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, errorMessage],
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        }));
      }
    },
    [state.sessionId, state.isLoading, state.cart]
  );

  const clearChat = useCallback(async () => {
    const sessionId = state.sessionId;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    setState({
      sessionId: null,
      messages: [],
      cart: [],
      isLoading: false,
      checkedOut: false,
      stripeUrl: null,
      error: null,
    });

    if (sessionId) {
      void clearSession(sessionId).catch((error) => {
        console.warn("[useChat] Failed to clear backend session:", error);
      });
    }
  }, [state.sessionId]);

  const removeFromCart = useCallback((productId: string) => {
    setState((prev) => {
      const nextCart = prev.cart.filter((item) => item.productId !== productId);
      if (prev.sessionId) {
        void updateSessionCart(prev.sessionId, nextCart).catch((error) => {
          console.warn("[useChat] Failed to persist cart removal:", error);
        });
      }
      return {
      ...prev,
        cart: nextCart,
      };
    });
  }, []);

  return {
    ...state,
    sendChat,
    clearChat,
    removeFromCart,
  };
}
