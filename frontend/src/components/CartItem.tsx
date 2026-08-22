import { motion } from "framer-motion";
import { X, Tag, TrendingDown } from "lucide-react";
import { CartItem } from "@/types";

interface CartItemProps {
  item: CartItem;
  index: number;
  onRemove: (productId: string) => void;
}

export function CartItemCard({ item, index, onRemove }: CartItemProps) {
  const savings = item.originalPrice - item.negotiatedPrice;
  const savingsPct = Math.round((savings / item.originalPrice) * 100);
  const isNegotiated = savings > 0.5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.9 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.23, 1, 0.32, 1],
        layout: { duration: 0.3 },
      }}
      className="group flex items-start gap-3 p-3 rounded-2xl glass hover:bg-white/[0.05] transition-all duration-200"
    >
      {/* Product image thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
            <Tag size={16} className="text-indigo-400/50" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/85 leading-tight truncate mb-1">
          {item.name}
        </p>

        <div className="flex items-center gap-2">
          {/* Negotiated price */}
          <span className="text-sm font-bold text-white">
            ${item.negotiatedPrice.toFixed(2)}
          </span>

          {/* Original price (crossed out if discounted) */}
          {isNegotiated && (
            <span className="text-xs text-muted-foreground/50 line-through">
              ${item.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Savings badge */}
        {isNegotiated && (
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={10} className="text-emerald-400" />
            <span className="text-[10px] font-semibold text-emerald-400">
              You saved ${savings.toFixed(2)} ({savingsPct}% off)
            </span>
          </div>
        )}

        {/* Qty */}
        <p className="text-[10px] text-muted-foreground/40 mt-0.5">
          Qty: {item.quantity}
        </p>
      </div>

      {/* Remove button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(item.productId)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground/50 hover:text-red-400 flex-shrink-0"
        title="Remove item"
      >
        <X size={12} />
      </motion.button>
    </motion.div>
  );
}
