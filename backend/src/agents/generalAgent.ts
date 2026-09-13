import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./state";
import dotenv from "dotenv";
import { createChatModel } from "../lib/llm";

dotenv.config();

const llm = createChatModel(0.7);

const GENERAL_SYSTEM_PROMPT = `You are LuminaShop's AI assistant — a warm, knowledgeable, and professional shopping concierge.
LuminaShop is a premium tech store selling Audio equipment, Laptops, Smartphones, Monitors, and Accessories.

You can help customers:
- Find products ("Show me wireless headphones")
- Negotiate prices ("Can I get a discount on the Sony headphones?")
- Complete purchases ("I'm ready to checkout")
- Answer general questions about the store

Keep responses concise (2-4 sentences), warm, and premium in tone. Never mention you are an AI language model.`;

/**
 * General Agent — handles conversational messages, greetings, and fallbacks.
 *
 * @param state - Current agent state
 * @returns Updated state with conversational response
 */
export async function generalAgentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  try {
    const response = await llm.invoke([
      new SystemMessage(GENERAL_SYSTEM_PROMPT),
      ...state.messages,
    ]);

    const text =
      typeof response.content === "string"
        ? response.content
        : "Welcome to LuminaShop! I can help you find premium tech products, negotiate prices, and checkout. What are you looking for today?";

    return {
      messages: [new AIMessage(text)],
      agentResponse: { text, type: "message" },
      agentMode: "end",
    };
  } catch (error) {
    console.error("[General Agent] Error:", error);
    return {
      agentResponse: {
        text: "Welcome to LuminaShop! I encountered a minor issue. How can I help you today?",
        type: "message",
      },
      agentMode: "end",
    };
  }
}
