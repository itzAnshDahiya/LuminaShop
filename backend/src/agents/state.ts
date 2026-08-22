import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

// ── Cart Item ──────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  originalPrice: number;
  negotiatedPrice: number;
  baseCost: number;
  quantity: number;
  imageUrl?: string;
}

// ── Product (from DB) ──────────────────────────────────────────────────────

export interface ProductResult {
  id: string;
  name: string;
  description: string;
  price: number;
  base_cost: number;
  category: string;
  imageUrl?: string;
  stock: number;
  similarity?: number;
}

// ── Agent Modes ─────────────────────────────────────────────────────────────

export type AgentMode =
  | "router"
  | "discovery"
  | "negotiation"
  | "checkout"
  | "general"
  | "end";

// ── Structured Agent Response ────────────────────────────────────────────────

export interface AgentResponse {
  text: string;
  type: "message" | "products" | "cart_update" | "checkout";
  products?: ProductResult[];
  cartItem?: CartItem;
  stripeUrl?: string;
  total?: number;
  counterOffer?: {
    productId: string;
    name: string;
    price: number;
  };
}

// ── LangGraph Annotation State ───────────────────────────────────────────────

export const AgentStateAnnotation = Annotation.Root({
  // Full conversation history (LangChain BaseMessage array)
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  // Session identifier — persisted to DB
  sessionId: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),

  // Active shopping cart
  cart: Annotation<CartItem[]>({
    reducer: (current, next) => next,
    default: () => [],
  }),

  // Minimum margin multiplier enforced on negotiation (1.15 = 15% over base_cost)
  marginMultiplier: Annotation<number>({
    reducer: (_, next) => next,
    default: () => 1.15,
  }),

  // Which agent should handle this turn
  agentMode: Annotation<AgentMode>({
    reducer: (_, next) => next,
    default: () => "router",
  }),

  // Structured response to send back to the client
  agentResponse: Annotation<AgentResponse | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  // Whether the session has been checked out
  checkedOut: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
