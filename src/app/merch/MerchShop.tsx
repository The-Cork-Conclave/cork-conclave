"use client";

import type { MerchProduct } from "@/lib/public-merch";

import { MerchCheckout } from "./MerchCheckout";

export function MerchShop({
  products,
  paymentSuccess = false,
}: {
  products: MerchProduct[];
  paymentSuccess?: boolean;
}) {
  return <MerchCheckout products={products} paymentSuccess={paymentSuccess} />;
}
