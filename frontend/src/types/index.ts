// ── Shared TypeScript types between frontend components ───────────────────

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

export interface CartItem {
  productId: string;
  name: string;
  originalPrice: number;
  negotiatedPrice: number;
  baseCost: number;
  quantity: number;
  imageUrl?: string;
}

export type MessageType = "message" | "products" | "cart_update" | "checkout";

export interface AgentResponse {
  text: string;
  type: MessageType;
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  response?: AgentResponse;
}

export interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  cart: CartItem[];
  isLoading: boolean;
  checkedOut: boolean;
  stripeUrl: string | null;
  error: string | null;
}

export interface SendMessageResult {
  sessionId: string;
  response: AgentResponse;
  cart: CartItem[];
  checkedOut: boolean;
  stripeUrl?: string;
}
