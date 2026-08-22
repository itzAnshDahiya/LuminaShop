import { motion } from "framer-motion";
import { Sparkles, ShoppingBag, Trash2 } from "lucide-react";

interface HeaderProps {
  cartCount: number;
  onClearChat: () => void;
  isConnected: boolean;
}

export function Header({ cartCount, onClearChat, isConnected }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="topbar"
    >
      <div className="topbar-title-wrap">
        <div className="mini-icon">
          <Sparkles size={14} />
        </div>
        <div>
          <p className="eyebrow small">AI shopping ops</p>
          <h2>Smart commerce dashboard</h2>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="status-pill">
          <span className={`status-dot ${isConnected ? "online" : "offline"}`} />
          {isConnected ? "AI ready" : "Connecting"}
        </div>

        {cartCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="cart-pill"
          >
            <ShoppingBag size={12} />
            <span>{cartCount}</span>
          </motion.div>
        )}

        <button
          type="button"
          onClick={onClearChat}
          className="clear-button"
          title="Clear conversation"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.header>
  );
}
