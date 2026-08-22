import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Mic } from "lucide-react";
import { ChatMessage, ProductResult } from "@/types";
import { MessageBubble, TypingIndicator } from "./MessageBubble";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onNegotiate: (product: ProductResult) => void;
  onAcceptOffer: (offer: { productId: string; name: string; price: number }) => void;
  checkedOut: boolean;
  paymentAccepted: boolean;
}

const SUGGESTIONS = [
  "Show me wireless headphones 🎧",
  "I need a lightweight laptop for travel",
  "What gaming monitors do you have?",
  "I'm looking for a premium smartphone",
];

export function ChatInterface({
  messages,
  isLoading,
  onSendMessage,
  onNegotiate,
  onAcceptOffer,
  checkedOut,
  paymentAccepted,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isFirstMessage = messages.length === 0;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    onSendMessage(trimmed);
    inputRef.current?.focus();
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="chat-shell">
      <div className="message-list">
        <AnimatePresence mode="popLayout">
          {isFirstMessage && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.5 }}
              className="welcome-panel"
            >
              <div className="welcome-orb">
                <Sparkles size={32} />
              </div>

              <h2>Your AI shopping concierge</h2>
              <p>
                Discover premium tech, negotiate prices with AI, and get the
                best deals — all through one guided conversation.
              </p>

              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion, i) => (
                  <motion.button
                    key={suggestion}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + i * 0.06 }}
                    onClick={() => onSendMessage(suggestion)}
                    className="suggestion-chip"
                    type="button"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className="message-row">
              <MessageBubble
                message={msg}
                onNegotiate={onNegotiate}
                onAcceptOffer={onAcceptOffer}
                paymentAccepted={paymentAccepted}
                isLast={msg === messages[messages.length - 1]}
              />
            </div>
          ))}

          {isLoading && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="message-row"
            >
              <TypingIndicator />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className="composer-panel">
        {checkedOut && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="checkout-banner"
          >
            {paymentAccepted
              ? "Payment accepted. Your order is complete and ready to ship."
              : "Secure payment link ready. Complete payment to place your order."}
          </motion.div>
        )}

        <div className="composer-row">
          <div className="composer-input-wrap">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || checkedOut}
              placeholder={
                checkedOut
                  ? "Order complete. Clear chat to start again."
                  : "Ask me anything — find products, negotiate prices..."
              }
              rows={1}
              className="chat-input"
              style={{ maxHeight: "120px", overflowY: "auto" }}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="icon-button"
            title="Voice input (coming soon)"
            type="button"
          >
            <Mic size={16} />
          </motion.button>

          <motion.button
            id="send-message-btn"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading || checkedOut}
            className="send-button"
            type="button"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles size={16} />
              </motion.div>
            ) : (
              <Send size={16} />
            )}
          </motion.button>
        </div>

        <p className="composer-hint">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}
