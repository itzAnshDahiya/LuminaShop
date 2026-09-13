import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState, AgentResponse } from "./state";
import { dbUpdateSession } from "../lib/dbStore";
import { createRazorpayPaymentLink } from "../lib/razorpay";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { createChatModel } from "../lib/llm";

dotenv.config();

const llm = createChatModel(0.2);

/**
 * Generates a secure checkout URL using Razorpay when configured, otherwise falls back to a safe demo URL.
 * @param sessionId - User session identifier
 * @param total - Total amount to charge
 * @returns Secure payment URL
 */
async function generateCheckoutUrl(
  sessionId: string,
  total: number
): Promise<string> {
  try {
    const razorpayUrl = await createRazorpayPaymentLink({
      sessionId,
      total,
    });

    if (razorpayUrl) {
      return razorpayUrl;
    }
  } catch (error) {
    console.warn("[Checkout] Razorpay unavailable, using fallback:", error);
  }

  const mockSessionId = `cs_test_${uuidv4()
    .replace(/-/g, "")
    .substring(0, 32)}`;
  const safeSessionId = encodeURIComponent(sessionId || "lumina-session");
  const amountCents = Math.round(total * 100);

  return `https://checkout.stripe.com/pay/${mockSessionId}?client_reference_id=${safeSessionId}&amount=${amountCents}&currency=usd`;
}

const CHECKOUT_SYSTEM_PROMPT = `You are LuminaShop's checkout specialist. 
The customer wants to complete their purchase.
Write a SHORT (2-3 sentence) warm, professional message that:
1. Confirms their order summary (mention item count and total)
2. Tells them their secure payment link is ready
3. Thanks them for shopping with LuminaShop

Keep the tone premium and celebratory. Do NOT include the actual URL in your message — it will be shown as a button.`;

/**
 * Checkout Agent — locks the cart, calculates total, and returns the secure payment link.
 *
 * @param state - Current agent state
 * @returns Updated state with checkout confirmation and payment URL
 */
export async function checkoutAgentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  try {
    const { cart, sessionId, checkedOut } = state;

    // Guard: already checked out
    if (checkedOut) {
      return {
        agentResponse: {
          text: "Your order has already been processed! Check your email for confirmation.",
          type: "message",
        },
        agentMode: "end",
      };
    }

    // Guard: empty cart
    if (!cart || cart.length === 0) {
      let text =
        "Your cart is empty! Browse our products and add something you love first.";
      try {
        const emptyCartResponse = await llm.invoke([
          new SystemMessage(
            "You are a friendly LuminaShop assistant. The customer tried to checkout but their cart is empty. Politely let them know and encourage them to browse products first."
          ),
          ...state.messages,
        ]);
        if (typeof emptyCartResponse.content === "string") {
          text = emptyCartResponse.content;
        }
      } catch (error) {
        console.warn("[Checkout] LLM empty cart response error:", error);
      }

      return {
        messages: [new AIMessage(text)],
        agentResponse: { text, type: "message" },
        agentMode: "end",
      };
    }

    // Calculate totals
    const total = cart.reduce(
      (sum, item) => sum + item.negotiatedPrice * item.quantity,
      0
    );
    const totalFormatted = parseFloat(total.toFixed(2));
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Generate payment URL; prefer Razorpay if configured.
    const stripeUrl = await generateCheckoutUrl(sessionId, totalFormatted);

    // Persist checkout state to DB
    try {
      await dbUpdateSession(sessionId, {
        checkedOut: true,
        stripeUrl,
        totalAmount: totalFormatted,
        cart: JSON.parse(JSON.stringify(cart)),
      });
    } catch (error) {
      console.error("[Checkout] Failed to persist session:", error);
    }

    // Generate confirmation message
    const cartSummary = cart
      .map(
        (item) =>
          `${item.name} × ${item.quantity} @ $${item.negotiatedPrice.toFixed(2)}`
      )
      .join(", ");

    let confirmationText = `Your order of ${itemCount} item(s) totaling $${totalFormatted} is ready! Click the button below to complete your secure payment.`;

    try {
      const llmResponse = await llm.invoke([
        new SystemMessage(CHECKOUT_SYSTEM_PROMPT),
        ...state.messages,
        new HumanMessage(
          `Cart: ${cartSummary}. Total: $${totalFormatted}. Items: ${itemCount}.`
        ),
      ]);
      if (typeof llmResponse.content === "string") {
        confirmationText = llmResponse.content;
      }
    } catch (error) {
      console.warn("[Checkout] LLM confirmation error:", error);
    }

    console.log(
      `[Checkout] Session ${sessionId} checked out. Total: $${totalFormatted}`
    );

    const agentResponse: AgentResponse = {
      text: confirmationText,
      type: "checkout",
      stripeUrl,
      total: totalFormatted,
    };

    return {
      messages: [new AIMessage(confirmationText)],
      checkedOut: true,
      agentResponse,
      agentMode: "end",
    };
  } catch (error) {
    console.error("[Checkout Agent] Unexpected error:", error);
    return {
      agentResponse: {
        text: "An error occurred during checkout. Please try again.",
        type: "message",
      },
      agentMode: "end",
    };
  }
}
