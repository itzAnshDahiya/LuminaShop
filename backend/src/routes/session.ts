import { Router, Request, Response } from "express";
import { dbGetSession, dbUpdateSession } from "../lib/dbStore";

const router = Router();

/**
 * GET /api/session/:id
 * Returns the full session state (cart, messages, checkout status).
 */
router.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const session = await dbGetSession(id);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({
      id: session.id,
      cart: session.cart,
      messages: session.messages,
      checkedOut: session.checkedOut,
      stripeUrl: session.stripeUrl,
      totalAmount: session.totalAmount,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    console.error("[Session Route] Error:", error);
    res.status(500).json({ error: "Failed to retrieve session" });
  }
});

/**
 * DELETE /api/session/:id
 * Clears the session (start fresh).
 */
router.delete("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    await dbUpdateSession(id, {
      messages: [],
      cart: [],
      checkedOut: false,
      stripeUrl: null,
      totalAmount: null,
    });

    res.json({ success: true, message: "Session cleared" });
  } catch (error) {
    console.error("[Session Route] Delete error:", error);
    res.status(500).json({ error: "Failed to clear session" });
  }
});

/**
 * PATCH /api/session/:id/cart
 * Persists a cart change made directly in the UI.
 */
router.patch("/:id/cart", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { cart } = req.body as { cart?: unknown };

  if (!Array.isArray(cart)) {
    res.status(400).json({ error: "Cart must be an array" });
    return;
  }

  try {
    await dbUpdateSession(id, { cart: JSON.parse(JSON.stringify(cart)) });
    res.json({ success: true, cart });
  } catch (error) {
    console.error("[Session Route] Cart update error:", error);
    res.status(500).json({ error: "Failed to update cart" });
  }
});

/**
 * GET /api/session/:id/cart
 * Returns only the cart for quick polling.
 */
router.get("/:id/cart", async (req: Request, res: Response) => {
  const id = String(req.params.id);

  try {
    const session = await dbGetSession(id);

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({
      cart: session.cart,
      checkedOut: session.checkedOut,
      totalAmount: session.totalAmount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve cart" });
  }
});

export default router;
