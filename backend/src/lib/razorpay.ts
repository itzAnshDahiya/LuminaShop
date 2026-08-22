import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

function getRazorpayEnv() {
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  };
}

export function isRazorpayConfigured() {
  const { keyId, keySecret } = getRazorpayEnv();
  return Boolean(keyId && keySecret);
}

export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayEnv();

  if (!keyId || !keySecret) return null;

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export async function createRazorpayPaymentLink({
  sessionId,
  total,
  customerName,
  customerEmail,
}: {
  sessionId: string;
  total: number;
  customerName?: string;
  customerEmail?: string;
}): Promise<string | null> {
  const client = getRazorpayClient();
  if (!client) {
    return null;
  }

  try {
    const amountInPaise = Math.round(Number(total) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return null;
    }

    const { frontendUrl } = getRazorpayEnv();

    const paymentLink = await client.paymentLink.create({
      amount: amountInPaise,
      currency: "INR",
      description: `LuminaShop order for ${sessionId}`,
      customer: {
        name: customerName || "LuminaShop Customer",
        email: customerEmail || "customer@example.com",
        contact: "",
      },
      notify: {
        sms: true,
        email: true,
      },
      notes: {
        sessionId,
        source: "lumina-shop",
      },
      callback_url: `${frontendUrl.replace(/\/$/, "")}/?payment=success`,
      callback_method: "get",
    });

    return paymentLink.short_url || null;
  } catch (error) {
    console.error("[Razorpay] Payment link creation failed:", error);
    return null;
  }
}
