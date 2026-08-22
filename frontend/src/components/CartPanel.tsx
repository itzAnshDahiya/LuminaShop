import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  CreditCard,
  Package,
  TrendingDown,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { CartItem } from "@/types";
import { CartItemCard } from "./CartItem";

interface CartPanelProps {
  cart: CartItem[];
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  checkedOut: boolean;
  paymentAccepted: boolean;
  stripeUrl: string | null;
  isLoading: boolean;
}

export function CartPanel({
  cart,
  onRemoveItem,
  onCheckout,
  checkedOut,
  paymentAccepted,
  stripeUrl,
  isLoading,
}: CartPanelProps) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.originalPrice * item.quantity,
    0
  );
  const total = cart.reduce(
    (sum, item) => sum + item.negotiatedPrice * item.quantity,
    0
  );
  const totalSavings = subtotal - total;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full">
      {/* Cart header */}
      <div className="flex-shrink-0 p-4 pb-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500/40 to-cyan-500/40 flex items-center justify-center border border-indigo-500/20">
              <ShoppingCart size={13} className="text-indigo-300" />
            </div>
            <h2 className="font-bold text-base text-white">Your Cart</h2>
          </div>
          {itemCount > 0 && (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
            >
              {itemCount}
            </motion.span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/40 pl-9">
          AI-negotiated prices locked in
        </p>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto scroll-area px-4 py-3">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            /* Empty state */
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full min-h-[200px] text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Package size={24} className="text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/50 mb-1">
                Your cart is empty
              </p>
              <p className="text-xs text-muted-foreground/30 max-w-[180px] leading-relaxed">
                Ask the AI to find products and negotiate prices for you
              </p>
            </motion.div>
          ) : (
            /* Items list */
            <div className="space-y-2">
              {cart.map((item, idx) => (
                <CartItemCard
                  key={item.productId}
                  item={item}
                  index={idx}
                  onRemove={onRemoveItem}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Cart totals + checkout */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            key="totals"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 cart-total-bar p-4"
          >
            {/* Savings line */}
            {totalSavings > 0.5 && (
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <TrendingDown size={12} />
                  <span>AI Savings</span>
                </div>
                <span className="text-emerald-400 text-xs font-bold">
                  -${totalSavings.toFixed(2)}
                </span>
              </div>
            )}

            {/* Subtotal */}
            {totalSavings > 0.5 && (
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-xs text-muted-foreground/50">
                  Original
                </span>
                <span className="text-xs text-muted-foreground/50 line-through">
                  ${subtotal.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-bold text-white">Total</span>
              <motion.span
                key={total}
                initial={{ scale: 1.15, color: "#818cf8" }}
                animate={{ scale: 1, color: "#ffffff" }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-white"
              >
                ${total.toFixed(2)}
              </motion.span>
            </div>

            {/* Checkout button */}
            {checkedOut ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold"
              >
                <CheckCircle size={16} />
                {paymentAccepted ? "Payment Accepted" : "Checkout Ready"}
              </motion.div>
            ) : (
              <>
                <motion.button
                  id="checkout-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  disabled={isLoading}
                  className="checkout-btn w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles size={15} />
                      </motion.div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={15} />
                      Secure Checkout
                    </>
                  )}
                </motion.button>

                {/* Stripe URL quick link if available */}
                {stripeUrl && (
                  <motion.a
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    href={stripeUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 w-full py-2 rounded-xl border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-indigo-500/10 transition-colors"
                  >
                    🔒 Open Payment Link
                  </motion.a>
                )}
              </>
            )}

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-3 mt-3">
              {["🔒 Secure", "⚡ Instant", "🛡️ Protected"].map((badge) => (
                <span
                  key={badge}
                  className="text-[10px] text-muted-foreground/30 font-medium"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
