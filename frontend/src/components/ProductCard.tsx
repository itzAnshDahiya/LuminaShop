import { motion } from "framer-motion";
import { Heart, Share2, ShoppingCart, Plus, Tag, GitCompareArrows } from "lucide-react";
import { useState } from "react";
import { ProductResult } from "@/types";

interface ProductCardProps {
  product: ProductResult;
  index: number;
  onAddToCart?: (product: ProductResult) => void;
  onNegotiate?: (product: ProductResult) => void;
  onCompare?: (product: ProductResult) => void;
  isCompared?: boolean;
}

export function ProductCard({
  product,
  index,
  onNegotiate,
  onCompare,
  isCompared = false,
}: ProductCardProps) {
  const [isSaved, setIsSaved] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("luminashop_wishlist") || "[]").includes(product.id);
    } catch {
      return false;
    }
  });
  const savingsPercent = Math.round(
    ((product.price - product.base_cost * 1.15) / product.price) * 100
  );
  const valueScore = Math.max(1, Math.min(99, Math.round(100 - (product.price / 2400) * 35 + savingsPercent)));

  const toggleSaved = () => {
    setIsSaved((current: boolean) => {
      const next = !current;
      try {
        const saved = JSON.parse(localStorage.getItem("luminashop_wishlist") || "[]") as string[];
        const updated = next ? [...new Set([...saved, product.id])] : saved.filter((id) => id !== product.id);
        localStorage.setItem("luminashop_wishlist", JSON.stringify(updated));
      } catch {
        /* Ignore unavailable browser storage. */
      }
      return next;
    });
  };

  const shareProduct = async () => {
    const shareData = {
      title: product.name,
      text: `${product.name} - $${product.price.toFixed(2)} at LuminaShop`,
      url: product.imageUrl || window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(shareData.url);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="group relative overflow-hidden rounded-2xl glass gradient-border hover:bg-white/[0.06] transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-white/5 to-white/2">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-500 group-hover:scale-105 transform"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingCart size={32} className="text-white/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="category-badge px-2 py-0.5 rounded-full text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
            {product.category}
          </span>
        </div>

        {/* Savings badge */}
        {savingsPercent > 0 && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-0.5 bg-indigo-500/30 border border-indigo-400/30 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-300">
              <Tag size={8} />
              Up to {savingsPercent}% off
            </span>
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <button type="button" title={isSaved ? "Remove from saved products" : "Save product"} aria-label={isSaved ? "Remove from saved products" : "Save product"} onClick={toggleSaved} className={`product-icon-btn ${isSaved ? "selected" : ""}`}>
            <Heart size={13} fill={isSaved ? "currentColor" : "none"} />
          </button>
          <button type="button" title="Share product photo" aria-label="Share product photo" onClick={() => void shareProduct()} className="product-icon-btn">
            <Share2 size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground/90 leading-tight mb-1 line-clamp-1 group-hover:text-white transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>

        <div className="product-proof-row">
          <span>Value score {valueScore}/100</span>
          <span>{product.stock} in stock</span>
        </div>

        {/* Price + Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-white">
              ${product.price.toFixed(2)}
            </span>
            <p className="text-[10px] text-muted-foreground/50">listed price</p>
          </div>

          <div className="product-actions">
            <button type="button" title={isCompared ? "Remove from comparison" : "Compare product"} aria-label={isCompared ? "Remove from comparison" : "Compare product"} onClick={() => onCompare?.(product)} className={`product-icon-btn product-icon-btn-light ${isCompared ? "selected" : ""}`}>
              <GitCompareArrows size={13} />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNegotiate?.(product)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 hover:border-indigo-400/50 text-indigo-300 text-xs font-semibold transition-all"
            >
              <Plus size={12} />
              Negotiate
            </motion.button>
          </div>
        </div>
      </div>

      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)"
        }}
      />
    </motion.article>
  );
}
