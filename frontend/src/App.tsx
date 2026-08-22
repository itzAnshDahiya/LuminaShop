import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { CartPanel } from "@/components/CartPanel";
import { useChat } from "@/hooks/useChat";
import { ProductResult } from "@/types";

export default function App() {
  const {
    messages,
    cart,
    isLoading,
    checkedOut,
    stripeUrl,
    sendChat,
    clearChat,
    removeFromCart,
  } = useChat();
  const [isConnected, setIsConnected] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "success";
  });

  useEffect(() => {
    const syncPaymentState = () => {
      if (typeof window === "undefined") return;
      const isSuccess = new URLSearchParams(window.location.search).get("payment") === "success";
      setPaymentAccepted(isSuccess || checkedOut);
    };

    syncPaymentState();
    window.addEventListener("popstate", syncPaymentState);
    return () => window.removeEventListener("popstate", syncPaymentState);
  }, [checkedOut]);

  useEffect(() => {
    let active = true;

    const checkHealth = async () => {
      try {
        const response = await fetch("/api/health", {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (active) {
          setIsConnected(response.ok);
        }
      } catch {
        if (active) {
          setIsConnected(false);
        }
      }
    };

    checkHealth();
    const interval = window.setInterval(checkHealth, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleNegotiate = useCallback(
    (product: ProductResult) => {
      sendChat(
        `I'm interested in the ${product.name} (listed at $${product.price.toFixed(2)}). Can you offer me a better price? Product ID: ${product.id}`
      );
    },
    [sendChat]
  );

  const handleAcceptOffer = useCallback(
    (offer: { productId: string; name: string; price: number }) => {
      sendChat(
        `I accept the offer for ${offer.name} at $${offer.price.toFixed(2)}. Add it to my cart. Product ID: ${offer.productId}`
      );
    },
    [sendChat]
  );

  const handleCheckout = useCallback(() => {
    sendChat("I'm ready to checkout and complete my purchase.");
  }, [sendChat]);

  return (
    <div className="app-shell">
      <div className="ambient-bg" />

      <div className="dashboard-shell">
        <aside className="sidebar-panel">
          <div className="brand-wrap">
            <div className="brand-mark">AI</div>
            <div>
              <p className="eyebrow">smart commerce</p>
              <h1>LuminaShop</h1>
            </div>
          </div>

          <nav className="nav-list">
            {[
              "Overview",
              "Product Discovery",
              "Negotiation Desk",
              "Checkout",
              "Reports",
            ].map((item, index) => (
              <button
                key={item}
                className={`nav-pill ${index === 2 ? "active" : ""}`}
                type="button"
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="sidebar-card">
            <span className="mini-label">AI status</span>
            <div className="status-row">
              <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
              <span>{isConnected ? "Agents online" : "Connecting..."}</span>
            </div>
            <p>Negotiation engine and product discovery are ready to assist.</p>
          </div>
        </aside>

        <main className="main-panel">
          <Header
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onClearChat={clearChat}
            isConnected={isConnected}
          />

          <div className="content-grid">
            <motion.section
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className="chat-panel"
            >
              <ChatInterface
                messages={messages}
                isLoading={isLoading}
                onSendMessage={sendChat}
                onNegotiate={handleNegotiate}
                onAcceptOffer={handleAcceptOffer}
                checkedOut={checkedOut || paymentAccepted}
                paymentAccepted={paymentAccepted}
              />
            </motion.section>

            <motion.aside
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="cart-panel-wrap"
            >
              <CartPanel
                cart={cart}
                onRemoveItem={removeFromCart}
                onCheckout={handleCheckout}
                checkedOut={checkedOut || paymentAccepted}
                paymentAccepted={paymentAccepted}
                stripeUrl={stripeUrl}
                isLoading={isLoading}
              />
            </motion.aside>
          </div>
        </main>
      </div>
    </div>
  );
}
