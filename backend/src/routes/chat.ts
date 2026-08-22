import { Router, Request, Response } from "express";
import { HumanMessage } from "@langchain/core/messages";
import { commerceGraph } from "../agents/graph";
import { CartItem } from "../agents/state";
import { dbGetSession, dbCreateSession, dbUpdateSession } from "../lib/dbStore";
import { v4 as uuidv4 } from "uuid";

const router = Router();

interface ChatRequestBody {
  message: string;
  sessionId?: string;
}

interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

/**
 * POST /api/chat
 *
 * Body: { message: string, sessionId?: string }
 * Response: { sessionId, response, cart, checkedOut, stripeUrl? }
 */
router.post("/", async (req: Request, res: Response) => {
  const { message, sessionId: incomingSessionId } =
    req.body as ChatRequestBody;

  if (!message || typeof message !== "string" || message.trim() === "") {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  let sessionId = incomingSessionId;

  try {
    // ── 1. Load or Create Session ────────────────────────────────────────

    let session = sessionId
      ? await dbGetSession(sessionId)
      : null;

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

    // ── 2. Reconstruct LangChain message history ──────────────────────────

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

    // ── 3. Invoke the LangGraph ───────────────────────────────────────────

    const result = await commerceGraph.invoke({
      messages: [...langchainHistory, new HumanMessage(message.trim())],
      sessionId: sessionId!,
      cart: currentCart,
      marginMultiplier: 1.15,
      checkedOut: session.checkedOut,
    });

    // ── 4. Extract agent response ─────────────────────────────────────────

    const agentResponse = result.agentResponse;
    const updatedCart: CartItem[] = result.cart || currentCart;
    const checkedOut: boolean = result.checkedOut || false;

    // ── 5. Persist updated state to DB ────────────────────────────────────

    const updatedMessages: StoredMessage[] = [
      ...storedMessages,
      {
        role: "user",
        content: message.trim(),
        timestamp: new Date().toISOString(),
      },
      {
        role: "assistant",
        content: agentResponse?.text || "",
        timestamp: new Date().toISOString(),
      },
    ];

    await dbUpdateSession(sessionId!, {
      messages: updatedMessages,
      cart: updatedCart,
      checkedOut,
      ...(result.agentResponse?.stripeUrl && {
        stripeUrl: result.agentResponse.stripeUrl,
        totalAmount: result.agentResponse.total,
      }),
    });

    // ── 6. Send response ──────────────────────────────────────────────────

    res.json({
      sessionId,
      response: agentResponse,
      cart: updatedCart,
      checkedOut,
      stripeUrl: session.stripeUrl || result.agentResponse?.stripeUrl,
    });
  } catch (error) {
    console.error("[Chat Route] Error:", error);
    res.status(500).json({
      error: "An error occurred processing your message",
      details:
        process.env.NODE_ENV === "development"
          ? String(error)
          : undefined,
    });
  }
});

export default router;
