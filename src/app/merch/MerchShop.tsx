"use client";

import { useState } from "react";

import type { MerchProduct } from "@/lib/public-merch";

import { MerchCheckout } from "./MerchCheckout";

export function MerchShop({ products }: { products: MerchProduct[] }) {
  if (products.length === 1) {
    return <MerchCheckout product={products[0]} />;
  }

  return <ProductPicker products={products} />;
}

function ProductPicker({ products }: { products: MerchProduct[] }) {
  const [selectedId, setSelectedId] = useState(products[0].id);
  const selected = products.find((p) => p.id === selectedId) ?? products[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-cork-cream">Merch</h1>
        <p className="mt-2 text-sm text-cork-blush">Choose a product to order.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              selected.id === p.id
                ? "border-cork-coral text-cork-cream"
                : "border-white/15 text-cork-blush"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <MerchCheckout key={selected.id} product={selected} />
    </div>
  );
}
