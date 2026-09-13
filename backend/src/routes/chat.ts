import { Router, Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { commerceGraph } from "../agents/graph";
import { CartItem } from "../agents/state";
import { dbGetSession, dbCreateSession, dbUpdateSession } from "../lib/dbStore";
import { v4 as uuidv4, validate as validateUUID } from "uuid";

const router = Router();

/**
 * Chat request body
 */
interface ChatRequestBody {
  message: string;
  sessionId?: string;
}

/**
 * Stored message in database
 */
interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * POST /api/chat
 * Send a message and get an agent response
 *
 * Body: { message: string, sessionId?: string }
 * Response: { sessionId, response, cart, checkedOut, stripeUrl? }
 *
 * @throws 400 - Invalid input
 * @throws 500 - Internal server error
 */
router.post("/", async (req: Request, res: Response) => {
  const { message, sessionId: incomingSessionId } =
    req.body as ChatRequestBody;

  // ── 1. Input Validation ──────────────────────────────────────────────────
  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "Message is required and must be a string" });
    return;
  }

  if (message.length > 5000) {
    res.status(400).json({ error: "Message exceeds maximum length of 5000 characters" });
    return;
  }

  if (incomingSessionId && !validateUUID(incomingSessionId)) {
    res.status(400).json({ error: "Invalid sessionId format" });
    return;
  }

  let sessionId = incomingSessionId;

  try {
    // ── 2. Load or Create Session ────────────────────────────────────────────

    let session = sessionId ? await dbGetSession(sessionId) : null;

    if (!session) {
      sessionId = uuidv4();
      session = await dbCreateSession({
        id: sessionId,
        messages: [],
        cart: [],
        checkedOut: false,
      });
      console.log(`[Chat] Created new session: ${sessionId}`);
    } else {
      console.log(`[Chat] Resumed session: ${sessionId}`);
    }

    // ── 3. Reconstruct LangChain message history ──────────────────────────────

    const storedMessages = (session.messages as StoredMessage[]) || [];
    const { HumanMessage: HM, AIMessage: AM } = await import(
      "@langchain/core/messages"
    );

    const langchainHistory = storedMessages.flatMap((m) => {
      if (m.role === "user") return [new HM(m.content)];
      if (m.role === "assistant") return [new AM(m.content)];
      return [];
    });

    const currentCart = (session.cart as CartItem[]) || [];

    // ── 4. Invoke the LangGraph ───────────────────────────────────────────────

    let result;
    try {
      result = await commerceGraph.invoke({
        messages: [...langchainHistory, new HM(message.trim())],
        sessionId: sessionId!,
        cart: currentCart,
        marginMultiplier: 1.15,
        checkedOut: session.checkedOut,
      });
    } catch (graphError) {
      console.error("[Chat] Graph invocation error:", graphError);
      res.status(500).json({
        error: "Failed to process message",
        details: process.env.NODE_ENV === "development" ? String(graphError) : undefined,
      });
      return;
    }

    // ── 5. Validate agent response ───────────────────────────────────────────

    if (!result || !result.agentResponse) {
      console.error("[Chat] No agent response returned");
      res.status(500).json({ error: "No response from agent" });
      return;
    }

    const agentResponse = result.agentResponse;
    const updatedCart: CartItem[] = result.cart || currentCart;
    const checkedOut: boolean = result.checkedOut || false;

    // ── 6. Persist updated state to DB ────────────────────────────────────────

    const updatedMessages: StoredMessage[] = [
      ...storedMessages,
      {
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: agentResponse.text || "",
        timestamp: new Date().toISOString(),
      },
    ];

    try {
      await dbUpdateSession(sessionId!, {
        messages: updatedMessages,
        cart: updatedCart,
        checkedOut,
        ...(agentResponse.stripeUrl && {
          stripeUrl: agentResponse.stripeUrl,
          totalAmount: agentResponse.total,
        }),
      });
    } catch (dbError) {
      console.error("[Chat] Database update error:", dbError);
      res.status(500).json({ error: "Failed to update session" });
      return;
    }

    // ── 7. Send response ──────────────────────────────────────────────────────

    res.json({
      sessionId,
      response: agentResponse,
      cart: updatedCart,
      checkedOut,
      stripeUrl: session.stripeUrl || agentResponse.stripeUrl,
    });
  } catch (error) {
    console.error("[Chat Route] Unexpected error:", error);
    res.status(500).json({
      error: "An unexpected error occurred",
      details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
