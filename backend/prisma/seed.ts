import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Product seed data — 20 items across 4 categories
const products = [
  // ── Audio ──────────────────────────────────────────────────────────────────
  {
    name: "Sony WH-1000XM5",
    description:
      "Industry-leading noise canceling wireless headphones with Auto NC Optimizer, 30-hour battery, crystal clear hands-free calling, and Alexa built in.",
    price: 349.99,
    base_cost: 210.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400",
    stock: 50,
  },
  {
    name: "Apple AirPods Pro (2nd Gen)",
    description:
      "Active Noise Cancellation, Transparency mode, Adaptive EQ, and MagSafe Charging Case with USB‑C. Up to 30 hours total listening time.",
    price: 249.0,
    base_cost: 148.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=400",
    stock: 75,
  },
  {
    name: "Bose QuietComfort 45",
    description:
      "Wireless Bluetooth headphones with passive noise reduction, TriPort acoustic architecture, and up to 24 hours of battery life.",
    price: 279.0,
    base_cost: 165.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    stock: 40,
  },
  {
    name: "Jabra Evolve2 85",
    description:
      "Professional wireless headset with advanced ANC, 10-mic call technology, 37-hour battery and multipoint connection for hybrid workers.",
    price: 399.99,
    base_cost: 240.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
    stock: 30,
  },
  {
    name: "Sony WF-1000XM5 Earbuds",
    description:
      "True wireless earbuds with industry-leading noise cancellation, V2 processor, 8-hour battery (24 total with case), and multipoint connection.",
    price: 299.99,
    base_cost: 178.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
    stock: 60,
  },
  // ── Laptops ────────────────────────────────────────────────────────────────
  {
    name: 'Apple MacBook Pro 14" M3 Pro',
    description:
      "14-inch Liquid Retina XDR display, M3 Pro chip with 11-core CPU and 14-core GPU, 18GB unified memory, 512GB SSD. Up to 18 hours battery.",
    price: 1999.0,
    base_cost: 1350.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400",
    stock: 20,
  },
  {
    name: "Dell XPS 15 (2024)",
    description:
      "15.6-inch OLED 3.5K display, Intel Core Ultra 9 185H, 32GB DDR5, 1TB NVMe SSD, NVIDIA GeForce RTX 4070. Premium thin-and-light powerhouse.",
    price: 2299.0,
    base_cost: 1550.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400",
    stock: 15,
  },
  {
    name: "LG Gram 16 (2024)",
    description:
      "16-inch IPS display, Intel Core Ultra 7 155H, 32GB LPDDR5X, 1TB SSD, weighs just 1.19 kg. MIL-STD-810H certified durability, 22-hour battery.",
    price: 1499.0,
    base_cost: 980.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400",
    stock: 25,
  },
  {
    name: "ASUS ROG Zephyrus G14",
    description:
      "14-inch QHD+ 165Hz display, AMD Ryzen 9 8945HS, NVIDIA RTX 4070, 32GB DDR5, 1TB NVMe. Compact gaming powerhouse with MUX Switch.",
    price: 1799.0,
    base_cost: 1200.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400",
    stock: 18,
  },
  {
    name: "Microsoft Surface Pro 11",
    description:
      "13-inch Snapdragon X Elite, Copilot+ PC, 16GB RAM, 256GB SSD. Versatile 2-in-1 with all-day battery and Neural Processing Unit.",
    price: 1299.0,
    base_cost: 850.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1589532768851-68afd9a4c877?w=400",
    stock: 35,
  },
  // ── Smartphones ────────────────────────────────────────────────────────────
  {
    name: "iPhone 16 Pro Max",
    description:
      "6.9-inch Super Retina XDR display, A18 Pro chip, 48MP Fusion camera with 5x optical zoom, titanium design, Action Button. All-day battery.",
    price: 1199.0,
    base_cost: 780.0,
    category: "Smartphones",
    imageUrl: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400",
    stock: 45,
  },
  {
    name: "Samsung Galaxy S25 Ultra",
    description:
      "6.9-inch Dynamic AMOLED 2X, Snapdragon 8 Elite, 200MP camera, built-in S Pen, 5000mAh battery with 45W fast charging. Titanium frame.",
    price: 1299.0,
    base_cost: 840.0,
    category: "Smartphones",
    imageUrl: "https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=400",
    stock: 40,
  },
  {
    name: "Google Pixel 9 Pro",
    description:
      "6.3-inch LTPO OLED, Google Tensor G4, 50MP triple camera system, 7 years OS updates, Call Screen and Now Playing AI features. Polished finish.",
    price: 999.0,
    base_cost: 640.0,
    category: "Smartphones",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400",
    stock: 55,
  },
  {
    name: "OnePlus 12",
    description:
      "6.82-inch LTPO AMOLED 120Hz, Snapdragon 8 Gen 3, Hasselblad-tuned triple camera, 5400mAh battery, 100W SUPERVOOC fast charging.",
    price: 799.0,
    base_cost: 500.0,
    category: "Smartphones",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    stock: 65,
  },
  // ── Monitors & Displays ────────────────────────────────────────────────────
  {
    name: 'LG 27" UltraGear OLED (27GX790A)',
    description:
      "27-inch WOLED 4K 240Hz gaming monitor with 0.03ms response time, G-Sync Ultimate, VESA DisplayHDR TrueBlack 400 and 98.5% DCI-P3.",
    price: 799.99,
    base_cost: 520.0,
    category: "Monitors",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400",
    stock: 28,
  },
  {
    name: 'Samsung 32" Odyssey OLED G8',
    description:
      "32-inch 4K 240Hz QD-OLED gaming monitor, 0.03ms GTG, AMD FreeSync Premium Pro, USB-C 90W, Smart TV features and Tizen OS built in.",
    price: 899.99,
    base_cost: 590.0,
    category: "Monitors",
    imageUrl: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400",
    stock: 22,
  },
  {
    name: 'Dell UltraSharp 27" 4K USB-C',
    description:
      "27-inch IPS 4K monitor, 99% sRGB, USB-C 90W delivery, built-in KVM switch, Picture-in-Picture, RJ45 Ethernet, height-adjustable stand.",
    price: 649.99,
    base_cost: 420.0,
    category: "Monitors",
    imageUrl: "https://images.unsplash.com/photo-1551645120-d70bfe84c826?w=400",
    stock: 35,
  },
  {
    name: 'Apple Studio Display',
    description:
      "27-inch 5K Retina display, 600 nits brightness, True Tone, nano-texture glass option, 12MP camera with Center Stage, 96W USB-C charging.",
    price: 1599.0,
    base_cost: 1050.0,
    category: "Monitors",
    imageUrl: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400",
    stock: 12,
  },
  {
    name: "Logitech MX Master 3S",
    description:
      "Ergonomic wireless mouse, 8000 DPI Darkfield sensor works on glass, near-silent clicks, MagSpeed electromagnetic scroll wheel, 70-day battery.",
    price: 99.99,
    base_cost: 58.0,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
    stock: 120,
  },
  {
    name: "Keychron Q1 Pro Mechanical Keyboard",
    description:
      "75% wireless mechanical keyboard, QMK/VIA compatible, aluminum CNC frame, hot-swappable, Gateron G Pro switches, RGB backlit. Mac and Windows.",
    price: 199.99,
    base_cost: 118.0,
    category: "Accessories",
    imageUrl: "https://images.unsplash.com/photo-1595044426077-d36d9236d54a?w=400",
    stock: 80,
  },
];

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/api/embeddings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_EMBED_MODEL || "nomic-embed-text",
        prompt: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.statusText}`);
  }

  const data = (await response.json()) as { embedding: number[] };
  return data.embedding;
}

async function main() {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log("🌱 Starting LuminaShop database seed...\n");

  // Enable pgvector extension
  await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector`;
  console.log("✅ pgvector extension enabled\n");

  // Clear existing data
  await prisma.$executeRaw`DELETE FROM products`;
  console.log("🗑️  Cleared existing products\n");

  for (const product of products) {
    const embeddingInput = `${product.name}. ${product.description}. Category: ${product.category}.`;
    console.log(`📦 Embedding: ${product.name}...`);

    const embedding = await getEmbedding(embeddingInput);
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRaw`
      INSERT INTO products (id, name, description, price, base_cost, category, "imageUrl", stock, embedding, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        ${product.name},
        ${product.description},
        ${product.price},
        ${product.base_cost},
        ${product.category},
        ${product.imageUrl ?? null},
        ${product.stock},
        ${vectorStr}::vector,
        NOW(),
        NOW()
      )
    `;

    console.log(`   ✅ ${product.name} seeded (price: $${product.price})\n`);

    // Small delay to avoid overwhelming Ollama
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🎉 Successfully seeded ${products.length} products!`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
