import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat";
import sessionRouter from "./routes/session";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Rate Limiting ──────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "30", 10),
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health & Routes ─────────────────────────────────────────────────────────

/**
 * Health check payload
 * @returns {Object} Health status with service info
 */
const healthPayload = () => ({
  status: "ok",
  service: "LuminaShop Backend",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  database: process.env.DATABASE_URL ? "configured" : "not-configured",
});

app.get("/health", (_req, res) => {
  try {
    res.json(healthPayload());
  } catch (error) {
    console.error("[Health] Error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

app.get("/api/health", (_req, res) => {
  try {
    res.json(healthPayload());
  } catch (error) {
    console.error("[Health] Error:", error);
    res.status(500).json({ error: "Health check failed" });
  }
});

// Apply rate limiting to API routes
app.use("/api/chat", apiLimiter);
app.use("/api/session", apiLimiter);

app.use("/api/chat", chatRouter);
app.use("/api/session", sessionRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Server] Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development" ? err.message : undefined,
      timestamp: new Date().toISOString(),
    });
  }
);

// ── Start ────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║          LuminaShop Backend              ║
║   Multi-Agent Commerce Platform          ║
╠══════════════════════════════════════════╣
║  Port     : ${PORT}                          ║
║  Frontend : ${FRONTEND_URL}    ║
║  Ollama   : ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}   ║
║  Env      : ${process.env.NODE_ENV || "development"}            ║
║  Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || "30"} req/min         ║
╚══════════════════════════════════════════╝
  `);
});

server.on("error", (error: Error & { code?: string }) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("[Server] Closed");
    process.exit(0);
  });
});

export default app;
