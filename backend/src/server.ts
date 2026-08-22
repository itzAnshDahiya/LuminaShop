import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat";
import sessionRouter from "./routes/session";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ── Middleware ─────────────────────────────────────────────────────────────

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

// ── Routes ─────────────────────────────────────────────────────────────────

const healthPayload = () => ({
  status: "ok",
  service: "LuminaShop Backend",
  version: "1.0.0",
  timestamp: new Date().toISOString(),
  ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  database: process.env.DATABASE_URL ? "configured" : "not-configured",
});

app.get("/health", (_req, res) => {
  res.json(healthPayload());
});

app.get("/api/health", (_req, res) => {
  res.json(healthPayload());
});

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
    });
  }
);

// ── Start ──────────────────────────────────────────────────────────────────

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
╚══════════════════════════════════════════╝
  `);
});

server.on("error", (error: Error & { code?: string }) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});

export default app;
