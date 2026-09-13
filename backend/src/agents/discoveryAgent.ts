import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState, AgentResponse, ProductResult } from "./state";
import { generateEmbedding, toVectorLiteral } from "../lib/embeddings";
import prisma from "../lib/prisma";
import { dbSearchProducts } from "../lib/dbStore";
import dotenv from "dotenv";
import { createChatModel } from "../lib/llm";

dotenv.config();

const llm = createChatModel(0.3);

/**
 * Product row from database
 */
export interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  base_cost: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  similarity: number;
}

/**
 * Database product model
 */
export interface DBProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  base_cost: number;
  category: string;
  imageUrl: string | null;
  stock: number;
}

const DISCOVERY_SYSTEM_PROMPT = `You are LuminaShop's product discovery specialist — a knowledgeable, friendly assistant.
You have just performed a semantic search and found relevant products for the user.
Write a SHORT (2-3 sentence) warm, helpful response that:
1. Acknowledges what the user is looking for
2. Mentions you found some great matches
3. Invites them to ask for a better price if interested

Do NOT list the products yourself — they will be displayed as cards below your message.
Keep your tone premium and professional, like an Apple Store specialist.`;

/**
 * Discovery Agent Node
 *
 * Performs semantic pgvector similarity search on user queries.
 * Falls back to keyword search if vectors are unavailable.
 * Returns top 5 matching products with similarity scores.
 *
 * @param state - Current agent state
 * @returns Updated agent state with products and response
 * @throws Logs and handles errors gracefully without crashing
 */
export async function discoveryAgentNode(
  state: AgentState
): Promise<Partial<AgentState>> {
  try {
    const messages = state.messages;
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m._getType() === "human");

    if (!lastUserMessage) {
      return {
        agentResponse: {
          text: "I'm here to help you find great products! What are you looking for?",
          type: "message",
        },
        agentMode: "end",
      };
    }

    const userText =
      typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : JSON.stringify(lastUserMessage.content);

    let products: ProductResult[] = [];

    // ── Step 1: Attempt Vector Similarity Search via pgvector ─────────────────
    try {
      console.log("[Discovery] Generating embedding for user query");
      const embedding = await generateEmbedding(userText);

      if (!embedding || embedding.length === 0) {
        throw new Error("Embedding generation failed");
      }

      const vectorLiteral = toVectorLiteral(embedding);

      // Use Prisma's findRaw for safer queries
      const rawResults = await prisma.$queryRaw<ProductRow[]>`
        SELECT 
          id,
          name,
          description,
          price,
          base_cost,
          category,
          "imageUrl",
          stock,
          1 - (embedding <-> ${vectorLiteral}::vector) AS similarity
        FROM products
        WHERE stock > 0
        ORDER BY embedding <-> ${vectorLiteral}::vector
        LIMIT 5
      `;

      const results: ProductRow[] = Array.isArray(rawResults)
        ? (rawResults as ProductRow[])
        : [];

      if (results.length > 0) {
        products = results.map((r: ProductRow): ProductResult => ({
          id: r.id,
          name: r.name,
          description: r.description,
          price: Number(r.price),
          base_cost: Number(r.base_cost),
          category: r.category,
          imageUrl: r.imageUrl ?? undefined,
          stock: Number(r.stock),
          similarity: Number(r.similarity),
        }));
        console.log(`[Discovery] Found ${products.length} products via vector search`);
      }
    } catch (err) {
      console.warn("[Discovery] Vector search unavailable, using fallback:", err);
    }

    // ── Step 2: Fallback Keyword Search if Vector Search yields 0 items ───────
    if (products.length === 0) {
      try {
        console.log("[Discovery] Attempting fallback keyword search");
        const fallbackRows = await dbSearchProducts(userText, 5);
        products = fallbackRows.map((p): ProductResult => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: Number(p.price),
          base_cost: Number(p.base_cost),
          category: p.category,
          imageUrl: p.imageUrl ?? undefined,
          stock: p.stock,
        }));
        console.log(`[Discovery] Found ${products.length} products via keyword search`);
      } catch (fallbackErr) {
        console.error("[Discovery] Fallback search error:", fallbackErr);
      }
    }

    // ── Step 3: Handle No Matches Found ──────────────────────────────────────
    if (products.length === 0) {
      let text = "I couldn't find any products matching your search. Try different keywords!";
      try {
        const response = await llm.invoke([
          new SystemMessage(
            "You are a helpful LuminaShop assistant. The user searched for products but nothing was found. Apologize politely and suggest trying different keywords."
          ),
          ...messages,
        ]);
        if (typeof response.content === "string" && response.content.trim()) {
          text = response.content;
        }
      } catch (llmErr) {
        console.warn("[Discovery] LLM error generating no-results message:", llmErr);
      }

      return {
        messages: [new AIMessage(text)],
        agentResponse: { text, type: "message" },
        agentMode: "end",
      };
    }

    // ── Step 4: Generate Warm Conversational Intro ─────────────────────────────
    const productSummary = products
      .map((p: ProductResult) => `- ${p.name} ($${p.price.toFixed(2)})`)
      .join("\n");

    let introText = `I found ${products.length} great matches for you!`;
    try {
      const llmResponse = await llm.invoke([
        new SystemMessage(DISCOVERY_SYSTEM_PROMPT),
        ...messages,
        new HumanMessage(`Found these products:\n${productSummary}`),
      ]);

      if (typeof llmResponse.content === "string" && llmResponse.content.trim()) {
        introText = llmResponse.content;
      }
    } catch (llmErr) {
      console.warn("[Discovery] LLM error generating intro, using default:", llmErr);
    }

    console.log(`[Discovery] Returning ${products.length} products`);

    const agentResponse: AgentResponse = {
      text: introText,
      type: "products",
      products,
    };

    return {
      messages: [new AIMessage(introText)],
      agentResponse,
      agentMode: "end",
    };
  } catch (error) {
    console.error("[Discovery Agent] Unexpected error:", error);
    return {
      agentResponse: {
        text: "An error occurred while searching for products. Please try again.",
        type: "message",
      },
      agentMode: "end",
    };
  }
}
