"use client";

import type { MerchProduct } from "@/lib/public-merch";

import { MerchCheckout } from "./MerchCheckout";

export function MerchShop({ products }: { products: MerchProduct[] }) {
  return <MerchCheckout products={products} />;
}
