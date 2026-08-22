import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState, AgentMode } from "./state";
import dotenv from "dotenv";
import { createChatModel } from "../lib/llm";

dotenv.config();

const llm = createChatModel(0);

const ROUTER_SYSTEM_PROMPT = `You are a routing agent for LuminaShop, a premium e-commerce platform.
Your ONLY job is to classify the user's latest message into exactly one of these intents:

- "discovery"    : User wants to find, search, browse, or see products (e.g. "show me headphones", "what laptops do you have?")
- "negotiation"  : User wants to negotiate price, ask for discount, or add a specific product to cart (e.g. "can I get 20% off?", "add that to cart", "can you do better on price?")
- "checkout"     : User wants to checkout, pay, buy, finalize order (e.g. "I want to checkout", "proceed to payment", "place order")
- "general"      : Any other conversational message (greetings, questions about the store, etc.)

Respond with ONLY the intent word, nothing else. No punctuation, no explanation.`;

/**
 * Router node — classifies user intent and sets agentMode.
 */
export async function routerNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const messages = state.messages;
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m._getType() === "human");

  if (!lastUserMessage) {
    return { agentMode: "general" };
  }

  const userText =
    typeof lastUserMessage.content === "string"
      ? lastUserMessage.content
      : JSON.stringify(lastUserMessage.content);

  // Explicit offers and product IDs are unambiguous negotiation requests;
  // route them before the model so a conversational wording cannot misroute.
  if (
    /(product\s*id|\b(?:budget|discount|negotiate|offer|price|cost|cheap|deal|off)\b|\$\s?\d)/i.test(
      userText
    )
  ) {
    console.log(`[Router] Explicit price signal → negotiation`);
    return { agentMode: "negotiation" };
  }

  try {
    const response = await llm.invoke([
      new SystemMessage(ROUTER_SYSTEM_PROMPT),
      new HumanMessage(`Classify this message: "${userText}"`),
    ]);

    const intent = (
      typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content)
    )
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "") as AgentMode;

    const validModes: AgentMode[] = [
      "discovery",
      "negotiation",
      "checkout",
      "general",
    ];
    const resolvedMode: AgentMode = validModes.includes(intent)
      ? intent
      : "general";

    console.log(`[Router] Intent: "${userText}" → ${resolvedMode}`);
    return { agentMode: resolvedMode };
  } catch (error) {
    console.warn("[Router] LLM unavailable, using smart rule classification:", error);
    const lower = userText.toLowerCase();
    let fallbackMode: AgentMode = "general";
    if (/(checkout|buy|pay|order|purchase|finalize)/.test(lower)) {
      fallbackMode = "checkout";
    } else if (/(discount|price|negotiate|offer|cheap|deal|cost|off|percent|%|less|do better|reduce|lower|how much|cart)/.test(lower)) {
      fallbackMode = "negotiation";
    } else if (/(show|find|search|look|headphones|laptop|phone|monitor|display|earbuds|keyboard|mouse|bose|sony|apple|macbook|iphone|pixel|samsung|dell|lg|asus|product|what|browse|recommend)/.test(lower)) {
      fallbackMode = "discovery";
    }
    console.log(`[Router Fallback] Intent: "${userText}" → ${fallbackMode}`);
    return { agentMode: fallbackMode };
  }
}

/**
 * Conditional edge function — returns the next node name based on agentMode.
 */
export function routerEdge(state: AgentState): string {
  const mode = state.agentMode;
  switch (mode) {
    case "discovery":
      return "discovery_agent";
    case "negotiation":
      return "negotiation_agent";
    case "checkout":
      return "checkout_agent";
    default:
      return "general_agent";
  }
}
