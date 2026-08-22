import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  AgentState,
  AgentResponse,
  CartItem,
  ProductResult,
} from "./state.js";
import prisma from "../lib/prisma.js";
import { dbFindProductById, dbFindProductByQuery, dbSearchProducts } from "../lib/dbStore";
import dotenv from "dotenv";
import { createChatModel } from "../lib/llm";

dotenv.config();

const llm = createChatModel(0.4);

// ── Price Negotiation Tool ──────────────────────────────────────────────────

const createAgentTool: any = tool;

/**
 * The negotiation tool enforces the business rule:
 *   P_final = max(proposed_price, base_cost × 1.15)
 *
 * The LLM calls this tool. The server does the enforcement — the LLM cannot
 * bypass the margin floor regardless of what price it proposes.
 */
const proposePriceTool = createAgentTool(
  async (input: any) => {
    const { product_id, proposed_price, customer_budget } = input as {
      product_id: string;
      proposed_price: number;
      customer_budget?: number;
    };
    // Fetch product from DB (try ID first, then fuzzy name search)
    let product = (await dbFindProductById(product_id)) || (await dbFindProductByQuery(product_id));

    if (!product) {
      return JSON.stringify({ error: "Product not found", product_id });
    }

    const baseCost = Number(product.base_cost);
    const originalPrice = Number(product.price);
    const minimumPrice = parseFloat((baseCost * 1.15).toFixed(2));

    // ENFORCE: final price must be >= base_cost * 1.15
    const finalPrice = Math.max(proposed_price, minimumPrice);
    const discountPct = parseFloat(
      (((originalPrice - finalPrice) / originalPrice) * 100).toFixed(1)
    );
    const accepted = proposed_price >= minimumPrice;

    return JSON.stringify({
      product_id: product.id,
      product_name: product.name,
      original_price: originalPrice,
      base_cost: baseCost,
      minimum_price: minimumPrice,
      proposed_price,
      final_price: finalPrice,
      discount_percentage: discountPct,
      accepted,
      margin_maintained: true,
      message: accepted
        ? `Price approved at $${finalPrice.toFixed(2)} (${discountPct}% discount)`
        : `Minimum price enforced at $${finalPrice.toFixed(2)} (${discountPct}% discount from $${originalPrice})`,
    });
  },
  {
    name: "propose_price",
    description:
      "Proposes a negotiated price for a product. Enforces a minimum margin of 15% over base cost. Always use this tool when discussing price changes.",
    schema: z.object({
      product_id: z
        .string()
        .describe("The unique ID of the product being negotiated"),
      proposed_price: z
        .number()
        .describe("The price you want to offer the customer"),
      customer_budget: z
        .number()
        .optional()
        .describe("The customer's stated budget, if any"),
    }),
  }
);

const addToCartTool = createAgentTool(
  async (input: any) => {
    const { product_id, negotiated_price } = input as {
      product_id: string;
      negotiated_price: number;
    };
    let product = (await dbFindProductById(product_id)) || (await dbFindProductByQuery(product_id));

    if (!product) {
      return JSON.stringify({ error: "Product not found" });
    }

    const baseCost = Number(product.base_cost);
    const minimumPrice = parseFloat((baseCost * 1.15).toFixed(2));

    // Clamp to floor
    const finalPrice = parseFloat(
      Math.max(negotiated_price, minimumPrice).toFixed(2)
    );

    const cartItem: CartItem = {
      productId: product.id,
      name: product.name,
      originalPrice: Number(product.price),
      negotiatedPrice: finalPrice,
      baseCost,
      quantity: 1,
      imageUrl: product.imageUrl ?? undefined,
    };

    return JSON.stringify({
      success: true,
      cart_item: cartItem,
      message: `Added ${product.name} to cart at $${finalPrice.toFixed(2)}`,
    });
  },
  {
    name: "add_to_cart",
    description:
      "Adds a product to the customer's cart at a confirmed negotiated price. Only call after propose_price has been accepted.",
    schema: z.object({
      product_id: z.string().describe("Product ID to add to cart"),
      negotiated_price: z
        .number()
        .describe("The final agreed price for this item"),
    }),
  }
);

const NEGOTIATION_SYSTEM_PROMPT = `You are LuminaShop's negotiation specialist — a friendly but firm sales agent.

BUSINESS RULES (NON-NEGOTIABLE):
- You MUST use the "propose_price" tool for ANY price discussion
- The minimum price is always base_cost × 1.15 (15% margin floor) — enforced by the tool
- You CANNOT go below the tool's minimum_price, ever
- If the customer asks for too much discount, the tool will give you the minimum acceptable price — offer that

BEHAVIOR GUIDELINES:
- Be warm, friendly, and empathetic about budget constraints
- If a discount is within range (up to 15%), approve it enthusiastically
- If a discount exceeds what's allowed, counter with the minimum price and explain it's your best offer
- Once a price is agreed, use the "add_to_cart" tool to add the item
- Keep responses concise and premium in tone

IMPORTANT: Always call propose_price FIRST, then decide your response based on the tool result.`;

/**
 * Negotiation Agent — handles price negotiation with strict margin enforcement.
 */
export async function negotiationAgentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  const messages = state.messages;
  const currentCart = state.cart;

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message._getType() === "human");
  const lastUserText = lastUserMessage && typeof lastUserMessage.content === "string"
    ? lastUserMessage.content
    : "";
  const acceptedOffer = /\b(?:accept|accepted|proceed|take it|yes)\b/i.test(lastUserText);
  const acceptedProductId = lastUserText.match(/product\s*id:\s*([\w-]+)/i)?.[1];
  const acceptedPrice = lastUserText.match(/\$\s?(\d+(?:\.\d+)?)/)?.[1];

  if (acceptedOffer && acceptedProductId && acceptedPrice) {
    const cartResult = JSON.parse(
      await addToCartTool.invoke({
        product_id: acceptedProductId,
        negotiated_price: Number(acceptedPrice),
      })
    );
    if (cartResult.success && cartResult.cart_item) {
      const acceptedItem = cartResult.cart_item as CartItem;
      const updatedCart = [...currentCart];
      const existingIndex = updatedCart.findIndex(
        (item) => item.productId === acceptedItem.productId
      );
      if (existingIndex >= 0) updatedCart[existingIndex] = acceptedItem;
      else updatedCart.push(acceptedItem);

      const text = `Perfect. I've added **${acceptedItem.name}** to your cart at **$${acceptedItem.negotiatedPrice.toFixed(2)}**.`;
      return {
        messages: [new AIMessage(text)],
        cart: updatedCart,
        agentResponse: {
          text,
          type: "cart_update",
          cartItem: acceptedItem,
        },
        agentMode: "end",
      };
    }
  }

  const llmWithTools = llm.bindTools([proposePriceTool, addToCartTool]);

  try {
    // Run agentic loop — LLM calls tools until it's done
    let currentMessages = [
      new SystemMessage(NEGOTIATION_SYSTEM_PROMPT),
      ...messages,
    ];

    let finalText = "";
    let newCartItem: CartItem | null = null;
    let counterOffer: AgentResponse["counterOffer"];
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS) {
      iterations++;
      const response = await llmWithTools.invoke(currentMessages);
      currentMessages = [...currentMessages, response];

      // Check if the LLM wants to call tools
      const toolCalls =
        response.tool_calls && response.tool_calls.length > 0
          ? response.tool_calls
          : [];

      if (toolCalls.length === 0) {
        // No more tool calls — we have a final answer
        finalText =
          typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);
        break;
      }

      // Execute each tool call
      for (const toolCall of toolCalls) {
        let toolResult: string;

        if (toolCall.name === "propose_price") {
          toolResult = await proposePriceTool.invoke(toolCall.args as Parameters<typeof proposePriceTool.invoke>[0]);

          // The price proposal is the transaction boundary. Once the server
          // accepts it, add the same clamped price to the cart immediately;
          // the LLM should not be able to leave a successful negotiation half-finished.
          try {
            const proposal = JSON.parse(toolResult) as {
              accepted?: boolean;
              product_id?: string;
              final_price?: number;
            };
            if (
              proposal.accepted &&
              proposal.product_id &&
              typeof proposal.final_price === "number"
            ) {
              const cartResult = await addToCartTool.invoke({
                product_id: proposal.product_id,
                negotiated_price: proposal.final_price,
              });
              const parsedCartResult = JSON.parse(cartResult);
              if (parsedCartResult.success && parsedCartResult.cart_item) {
                newCartItem = parsedCartResult.cart_item as CartItem;
              }
            } else if (
              !proposal.accepted &&
              proposal.product_id &&
              typeof proposal.final_price === "number"
            ) {
              const product = await dbFindProductById(proposal.product_id);
              if (product) {
                counterOffer = {
                  productId: product.id,
                  name: product.name,
                  price: proposal.final_price,
                };
              }
            }
          } catch {
            /* Keep the proposal response if cart persistence fails. */
          }
        } else if (toolCall.name === "add_to_cart") {
          toolResult = await addToCartTool.invoke(toolCall.args as Parameters<typeof addToCartTool.invoke>[0]);

          // Parse cart item from result
          try {
            const parsed = JSON.parse(toolResult) as {
              success?: boolean;
              cart_item?: CartItem;
            };
            if (parsed.success && parsed.cart_item) {
              newCartItem = parsed.cart_item;
            }
          } catch {
            /* ignore parse errors */
          }
        } else {
          toolResult = JSON.stringify({ error: "Unknown tool" });
        }

        // Add tool result as a tool message
        const { ToolMessage } = await import("@langchain/core/messages");
        currentMessages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id || "tool_call",
          })
        );
      }
    }

    if (!finalText) {
      finalText = "I've processed your request. Is there anything else I can help you with?";
    }

    // Build updated cart
    let updatedCart = [...currentCart];
    let cartUpdate: CartItem | undefined;

    if (newCartItem) {
      const negotiatedItem = newCartItem;
      const existingIdx = updatedCart.findIndex(
        (item) => item.productId === negotiatedItem.productId
      );
      if (existingIdx >= 0) {
        updatedCart[existingIdx] = {
          ...updatedCart[existingIdx],
          negotiatedPrice: negotiatedItem.negotiatedPrice,
        };
      } else {
        updatedCart.push(negotiatedItem);
      }
      cartUpdate = negotiatedItem;
    }

    const agentResponse: AgentResponse = {
      text: finalText,
      type: newCartItem ? "cart_update" : "message",
      cartItem: cartUpdate,
      counterOffer,
    };

    return {
      messages: [new AIMessage(finalText)],
      cart: updatedCart,
      agentResponse,
      agentMode: "end",
    };
  } catch (error) {
    console.warn("[Negotiation] LLM unavailable, using deterministic negotiation:", error);
    const lastUserMsg = [...messages].reverse().find((m) => m._getType() === "human");
    const userText = lastUserMsg ? (typeof lastUserMsg.content === "string" ? lastUserMsg.content : JSON.stringify(lastUserMsg.content)) : "";

    const matchedProducts = await dbSearchProducts(userText, 1);
    const product = matchedProducts[0];

    if (!product) {
      const fallbackText = "I'm ready to help you negotiate! Which product would you like a special offer on?";
      return {
        messages: [new AIMessage(fallbackText)],
        agentResponse: { text: fallbackText, type: "message" },
        agentMode: "end",
      };
    }

    const priceMatch = userText.match(/\$?(\d+(\.\d+)?)/);
    const percentMatch = userText.match(/(\d+)%/);

    let proposedPrice = product.price * 0.85;
    if (priceMatch && parseFloat(priceMatch[1]) > 0 && parseFloat(priceMatch[1]) < product.price) {
      proposedPrice = parseFloat(priceMatch[1]);
    } else if (percentMatch) {
      const pct = parseFloat(percentMatch[1]);
      proposedPrice = product.price * (1 - pct / 100);
    }

    const toolResStr = await proposePriceTool.invoke({
      product_id: product.id,
      proposed_price: proposedPrice,
    });
    const toolRes = JSON.parse(toolResStr);

    let finalText = "";
    let cartUpdate: CartItem | undefined;
    let counterOffer: AgentResponse["counterOffer"];
    let updatedCart = [...currentCart];

    if (toolRes.accepted) {
      finalText = `Great news! I can approve your price for **${product.name}** at **$${toolRes.final_price.toFixed(2)}** (${toolRes.discount_percentage}% off!). I've added it to your cart.`;

      const cartResStr = await addToCartTool.invoke({
        product_id: product.id,
        negotiated_price: toolRes.final_price,
      });
      const cartRes = JSON.parse(cartResStr);
      if (cartRes.success && cartRes.cart_item) {
        const negotiatedItem = cartRes.cart_item as CartItem;
        cartUpdate = negotiatedItem;
        const existingIdx = updatedCart.findIndex((i) => i.productId === product.id);
        if (existingIdx >= 0) {
          updatedCart[existingIdx] = negotiatedItem;
        } else {
          updatedCart.push(negotiatedItem);
        }
      }
    } else {
      counterOffer = {
        productId: product.id,
        name: product.name,
        price: Number(toolRes.final_price),
      };
      finalText = `I can't go as low as your offer, but the absolute minimum price I can offer on **${product.name}** is **$${toolRes.final_price.toFixed(2)}** (${toolRes.discount_percentage}% off listed price of $${product.price}). Shall we proceed with this offer?`;
    }

    return {
      messages: [new AIMessage(finalText)],
      cart: updatedCart,
      agentResponse: {
        text: finalText,
        type: cartUpdate ? "cart_update" : "message",
        cartItem: cartUpdate,
        counterOffer,
      },
      agentMode: "end",
    };
  }
}

// Export for use in general product lookup
export { proposePriceTool };
export type { ProductResult };
