import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownUp, Bot, GitCompareArrows, User, X } from "lucide-react";
import { ChatMessage, ProductResult } from "@/types";
import { ProductCard } from "./ProductCard";

interface MessageBubbleProps {
  message: ChatMessage;
  onNegotiate?: (product: ProductResult) => void;
  onAcceptOffer?: (offer: { productId: string; name: string; price: number }) => void;
  isLast?: boolean;
  paymentAccepted?: boolean;
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/80 to-cyan-500/80 flex items-center justify-center flex-shrink-0">
        <Bot size={13} className="text-white" />
      </div>

      <div className="msg-assistant px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex items-center gap-1.5 py-1">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({
  message,
  onNegotiate,
  onAcceptOffer,
  paymentAccepted = false,
}: MessageBubbleProps) {
  const [sortMode, setSortMode] = useState<"match" | "price" | "savings">("match");
  const [compareProducts, setCompareProducts] = useState<ProductResult[]>([]);
  const isUser = message.role === "user";
  const hasProducts = Boolean(message.response?.products?.length);
  const isCheckout = message.response?.type === "checkout";
  const isCartUpdate = message.response?.type === "cart_update";
  const visibleProducts = [...(message.response?.products || [])].sort((left, right) => {
    if (sortMode === "price") return left.price - right.price;
    if (sortMode === "savings") {
      const leftSavings = (left.price - left.base_cost * 1.15) / left.price;
      const rightSavings = (right.price - right.base_cost * 1.15) / right.price;
      return rightSavings - leftSavings;
    }
    return (right.similarity || 0) - (left.similarity || 0);
  });

  const toggleCompare = (product: ProductResult) => {
    setCompareProducts((current) => {
      if (current.some((item) => item.id === product.id)) return current.filter((item) => item.id !== product.id);
      return current.length < 3 ? [...current, product] : current;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-violet-600"
            : "bg-gradient-to-br from-indigo-500/80 to-cyan-500/80"
        }`}
      >
        {isUser ? (
          <User size={13} className="text-white" />
        ) : (
          <Bot size={13} className="text-white" />
        )}
      </div>

      {/* Bubble content */}
      <div className={`flex flex-col gap-3 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Main text bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "msg-user rounded-br-sm text-white/90"
              : "msg-assistant rounded-bl-sm text-foreground/85"
          }`}
        >
          {/* Checkout / Cart update accent */}
          {isCheckout && (
            <div className="flex items-center gap-1.5 mb-2 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {paymentAccepted ? "Payment Accepted" : "Secure Payment Link Ready"}
            </div>
          )}
          {isCartUpdate && message.response?.cartItem && (
            <div className="flex items-center gap-1.5 mb-2 text-cyan-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Added to Cart — ${message.response.cartItem.negotiatedPrice.toFixed(2)}
            </div>
          )}

          <p className="whitespace-pre-wrap">{message.content}</p>

          {message.response?.counterOffer && (
            <button
              type="button"
              onClick={() => onAcceptOffer?.(message.response!.counterOffer!)}
              className="mt-3 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20"
            >
              Accept ${message.response.counterOffer.price.toFixed(2)} offer
            </button>
          )}

          {/* Stripe checkout button */}
          {isCheckout && message.response?.stripeUrl && (
            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              href={message.response.stripeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="checkout-btn mt-3 flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-white text-sm font-semibold"
            >
              <span>✅</span>
              {paymentAccepted ? "Payment Accepted" : "Open Secure Payment"} — ${message.response.total?.toFixed(2)}
            </motion.a>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground/40 mt-1 select-none">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Product cards grid */}
        {hasProducts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-full"
          >
            <div className="recommendation-toolbar">
              <span className="recommendation-count">{visibleProducts.length} matches</span>
              <label className="sort-control">
                <ArrowDownUp size={13} />
                <span className="sr-only">Sort recommendations</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value as typeof sortMode)}>
                  <option value="match">Best match</option>
                  <option value="price">Lowest price</option>
                  <option value="savings">Best savings</option>
                </select>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleProducts.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={idx}
                  onNegotiate={(p) => {
                    onNegotiate?.(p);
                  }}
                  onCompare={toggleCompare}
                  isCompared={compareProducts.some((item) => item.id === product.id)}
                />
              ))}
            </div>
            {compareProducts.length > 0 && (
              <div className="comparison-panel">
                <div className="comparison-heading">
                  <div>
                    <span className="comparison-kicker"><GitCompareArrows size={13} /> Decision helper</span>
                    <strong>Compare {compareProducts.length}/3</strong>
                  </div>
                  <button type="button" title="Clear comparison" aria-label="Clear comparison" onClick={() => setCompareProducts([])}><X size={15} /></button>
                </div>
                <div className="comparison-grid">
                  {compareProducts.map((product) => (
                    <div key={product.id} className="comparison-item">
                      <strong>{product.name}</strong>
                      <span>${product.price.toFixed(2)}</span>
                      <small>{Math.round(((product.price - product.base_cost * 1.15) / product.price) * 100)}% savings · {product.stock} in stock</small>
                    </div>
                  ))}
                </div>
                <p className="comparison-tip">Use price, savings, stock, and value score to break a tie.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export { TypingIndicator };
