import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOllama } from "@langchain/ollama";
import dotenv from "dotenv";

dotenv.config();

/** Create the configured chat provider without exposing credentials to clients. */
export function createChatModel(temperature: number): any {
  if (process.env.GEMINI_API_KEY) {
    return new ChatGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      temperature,
      maxRetries: 2,
    });
  }

  return new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: process.env.OLLAMA_LLM_MODEL || "llama3.2",
    temperature,
  });
}
