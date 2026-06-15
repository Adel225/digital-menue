"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── Types ────────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  name: string;
  order: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
};

// ── Config (set these in .env.local) ─────────────────────────────────────────

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "1006901212";
const WHATSAPP_MESSAGE = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ?? "Hello, I would like to place an order.";
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL ?? "https://res.cloudinary.com/dwcy6vc23/image/upload/v1781519305/Digital%20menue/logo.png";
const BUSINESS_NAME = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Abo-Eldahab";

// ── WhatsApp Button ───────────────────────────────────────────────────────────

function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 left-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#1ebe5d] transition-colors"
    >
      {/* WhatsApp SVG icon — no external dependency */}
      <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.535 5.845L.057 23.428a.5.5 0 0 0 .515.572l5.701-1.493A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-5.031-1.388l-.36-.214-3.733.978.995-3.63-.234-.373A9.799 9.799 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
      </svg>
    </a>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#F0EFE9]">
      <div className="aspect-square w-full overflow-hidden bg-[#F5F4EF]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#C8C5BC]">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-[#1C1C1A] font-large text-sm leading-tight">{product.name}</p>
        <p className="text-[#D97706] font-semibold text-sm mt-1">{product.price === 0 ? "-" : product.price} EGP</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});
  const skipScrollUpdate = useRef(false);

  // Fetch data once on mount
  useEffect(() => {
    async function fetchData() {
      const [catSnap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, "categories"), orderBy("order"))),
        getDocs(collection(db, "Products")),
      ]);

      const cats = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
      const prods = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

      setCategories(cats);
      setProducts(prods);

      if (cats.length > 0) setActiveCategory(cats[0].id);
      setLoading(false);
    }


    fetchData();
  }, []);

  // Scroll to category section when pill is clicked
  function handleCategoryClick(categoryId: string) {
    setActiveCategory(categoryId);
    skipScrollUpdate.current = true;
    const el = categoryRefs.current[categoryId];
    if (el) {
      // 110px offset accounts for the sticky header height
      const top = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: "smooth" });
      setTimeout(() => { skipScrollUpdate.current = false; }, 800);
    }
  }

  // Update active pill on scroll
  useEffect(() => {
    function onScroll() {
      if (skipScrollUpdate.current) return;
      for (const cat of [...categories].reverse()) {
        const el = categoryRefs.current[cat.id];
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveCategory(cat.id);
          break;
        }
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [categories]);

  const productsByCategory = (categoryId: string) =>
    products.filter((p) => p.categoryId === categoryId);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8]">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8] border-b border-[#EDECEA]">
        <div className="flex items-center justify-center h-16 px-4">
          {LOGO_URL ? (
            <img src={LOGO_URL} alt={BUSINESS_NAME} className="h-10 w-auto object-contain" />
          ) : (
            <span className="text-xl font-bold tracking-tight text-[#1C1C1A]">{BUSINESS_NAME}</span>
          )}
        </div>

        {/* ── Categories Bar ── */}
        {!loading && categories.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[#D97706] text-white"
                    : "bg-white text-[#6B6860] border border-[#E5E3DD] hover:border-[#D97706] hover:text-[#D97706]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="pb-24">
        {loading ? (
          // Skeleton loader
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-[#F0EFE9]">
                <div className="aspect-square bg-[#F0EFE9] animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-[#F0EFE9] rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-[#F0EFE9] rounded animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          categories.map((cat) => {
            const items = productsByCategory(cat.id);
            if (items.length === 0) return null;

            return (
              <section
                key={cat.id}
                ref={(el) => { categoryRefs.current[cat.id] = el; }}
              >
                {/* Category heading */}
                <div className="px-4 pt-6 pb-3">
                  <h2 className="text-base font-bold text-[#1C1C1A] uppercase tracking-wide">
                    {cat.name}
                  </h2>
                  <div className="mt-1 w-8 h-0.5 bg-[#D97706] rounded-full" />
                </div>

                {/* Product grid */}
                <div className="px-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      <WhatsAppButton />
    </div>
  );
}