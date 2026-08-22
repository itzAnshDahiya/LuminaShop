import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  base_cost: number;
  category: string;
  imageUrl: string | null;
  stock: number;
  similarity?: number;
}

export interface SessionRecord {
  id: string;
  messages: any[];
  cart: any[];
  checkedOut: boolean;
  stripeUrl: string | null;
  totalAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── In-Memory Fallback Seed Data ─────────────────────────────────────────────
const MOCK_PRODUCTS: ProductRecord[] = [
  {
    id: "prod-1",
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
    id: "prod-2",
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
    id: "prod-3",
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
    id: "prod-4",
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
    id: "prod-5",
    name: "Sony WF-1000XM5 Earbuds",
    description:
      "True wireless earbuds with industry-leading noise cancellation, V2 processor, 8-hour battery (24 total with case), and multipoint connection.",
    price: 299.99,
    base_cost: 178.0,
    category: "Audio",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400",
    stock: 60,
  },
  {
    id: "prod-6",
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
    id: "prod-7",
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
    id: "prod-8",
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
    id: "prod-9",
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
    id: "prod-10",
    name: "Microsoft Surface Pro 11",
    description:
      "13-inch Snapdragon X Elite, Copilot+ PC, 16GB RAM, 256GB SSD. Versatile 2-in-1 with all-day battery and Neural Processing Unit.",
    price: 1299.0,
    base_cost: 850.0,
    category: "Laptops",
    imageUrl: "https://images.unsplash.com/photo-1589532768851-68afd9a4c877?w=400",
    stock: 35,
  },
  {
    id: "prod-11",
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
    id: "prod-12",
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
    id: "prod-13",
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
    id: "prod-14",
    name: "OnePlus 12",
    description:
      "6.82-inch LTPO AMOLED 120Hz, Snapdragon 8 Gen 3, Hasselblad-tuned triple camera, 5400mAh battery, 100W SUPERVOOC fast charging.",
    price: 799.0,
    base_cost: 500.0,
    category: "Smartphones",
    imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400",
    stock: 65,
  },
  {
    id: "prod-15",
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
    id: "prod-16",
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
    id: "prod-17",
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
    id: "prod-18",
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
    id: "prod-19",
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
    id: "prod-20",
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

const mockSessions = new Map<string, SessionRecord>();

let isPrismaAvailable: boolean | null = null;
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient();

async function checkPrisma(): Promise<boolean> {
  if (isPrismaAvailable !== null) return isPrismaAvailable;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isPrismaAvailable = true;
  } catch {
    console.warn("[DB] PostgreSQL unavailable. Using high-performance in-memory store.");
    isPrismaAvailable = false;
  }
  return isPrismaAvailable;
}

export async function dbGetSession(id: string): Promise<SessionRecord | null> {
  if (await checkPrisma()) {
    try {
      const s = await prisma.session.findUnique({ where: { id } });
      if (s) return s as unknown as SessionRecord;
    } catch {
      isPrismaAvailable = false;
    }
  }
  return mockSessions.get(id) || null;
}

export async function dbCreateSession(data: {
  id: string;
  messages: any[];
  cart: any[];
  checkedOut: boolean;
}): Promise<SessionRecord> {
  if (await checkPrisma()) {
    try {
      const s = await prisma.session.create({ data });
      return s as unknown as SessionRecord;
    } catch {
      isPrismaAvailable = false;
    }
  }
  const session: SessionRecord = {
    ...data,
    stripeUrl: null,
    totalAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockSessions.set(data.id, session);
  return session;
}

export async function dbUpdateSession(
  id: string,
  data: Partial<SessionRecord>
): Promise<SessionRecord> {
  if (await checkPrisma()) {
    try {
      const s = await prisma.session.update({ where: { id }, data: data as any });
      return s as unknown as SessionRecord;
    } catch {
      isPrismaAvailable = false;
    }
  }
  const existing = mockSessions.get(id) || {
    id,
    messages: [],
    cart: [],
    checkedOut: false,
    stripeUrl: null,
    totalAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const updated: SessionRecord = {
    ...existing,
    ...data,
    updatedAt: new Date(),
  };

  mockSessions.set(id, updated);
  return updated;
}

export async function dbFindProductById(id: string): Promise<ProductRecord | null> {
  if (await checkPrisma()) {
    try {
      const p = await prisma.product.findUnique({ where: { id } });
      if (p) return p as unknown as ProductRecord;
    } catch {
      isPrismaAvailable = false;
    }
  }
  return MOCK_PRODUCTS.find((p) => p.id === id || p.name.toLowerCase() === id.toLowerCase()) || null;
}

export async function dbFindProductByQuery(query: string): Promise<ProductRecord | null> {
  if (await checkPrisma()) {
    try {
      const p = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
      });
      if (p) return p as unknown as ProductRecord;
    } catch {
      isPrismaAvailable = false;
    }
  }

  const q = query.toLowerCase();
  return (
    MOCK_PRODUCTS.find(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    ) || null
  );
}

export async function dbSearchProducts(userText: string, limit = 5): Promise<ProductRecord[]> {
  if (await checkPrisma()) {
    try {
      const keywords = userText.split(/\s+/).filter((w) => w.length > 2);
      const rows = await prisma.product.findMany({
        where: {
          stock: { gt: 0 },
          OR: [
            { name: { contains: userText, mode: "insensitive" } },
            { description: { contains: userText, mode: "insensitive" } },
            { category: { contains: userText, mode: "insensitive" } },
            ...keywords.map((kw) => ({
              name: { contains: kw, mode: "insensitive" as const },
            })),
          ],
        },
        take: limit,
      });
      if (rows.length > 0) return rows as unknown as ProductRecord[];
    } catch {
      isPrismaAvailable = false;
    }
  }

  const q = userText.toLowerCase();
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);

  const ranked = MOCK_PRODUCTS.map((product) => {
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    const description = product.description.toLowerCase();
    const score = keywords.reduce((total, keyword) => {
      if (category.includes(keyword)) return total + 8;
      if (name.includes(keyword)) return total + 5;
      if (description.includes(keyword)) return total + 1;
      return total;
    }, q && `${name} ${description} ${category}`.includes(q) ? 10 : 0);

    return { product, score };
  })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score);

  return ranked.length > 0
    ? ranked.slice(0, limit).map(({ product }) => product)
    : MOCK_PRODUCTS.slice(0, limit);
}

export { MOCK_PRODUCTS };
