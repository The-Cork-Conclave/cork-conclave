import { cache } from "react";

import { getPublicApiBaseUrl, safeFetchJson } from "@/lib/api-client";

export type MerchColor = {
  label: string;
  value: string;
};

export type MerchProduct = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price_in_kobo: number;
  delivery_fee_in_kobo: number;
  pickup_location: string;
  colors: MerchColor[];
  sizes: string[];
  is_active: boolean;
  created_at: string;
};

export type MerchProductsResponse = {
  products: MerchProduct[];
};

export type MerchCheckoutItem = {
  product_id: string;
  recipient_name: string;
  recipient_email?: string;
  recipient_phone: string;
  color_label: string;
  size: string;
  fulfillment_type: "pickup" | "delivery";
  delivery_address?: string | null;
  delivery_note?: string | null;
};

export const getPublicMerchProducts = cache(async function getPublicMerchProducts(): Promise<MerchProduct[]> {
  const base = getPublicApiBaseUrl();
  if (!base) return [];
  const result = await safeFetchJson<MerchProductsResponse>(`${base}/public/merch/products`, {
    cache: "no-store",
    timeoutMs: 10_000,
  });
  if (!result.ok) return [];
  return result.data.products ?? [];
});

export async function hasPublicMerch(): Promise<boolean> {
  const products = await getPublicMerchProducts();
  return products.length > 0;
}

export async function createMerchCheckout(
  items: MerchCheckoutItem[],
): Promise<{ ok: true; checkout_url: string } | { ok: false; error: string; status?: number }> {
  const base = getPublicApiBaseUrl();
  if (!base) return { ok: false, error: "Missing API URL" };

  try {
    const res = await fetch(`${base}/public/merch/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const json = (await res.json()) as { message?: string };
        if (typeof json.message === "string" && json.message.trim()) message = json.message;
      } catch {
        // ignore
      }
      return { ok: false, error: message, status: res.status };
    }
    const json = (await res.json()) as { checkout_url: string };
    return { ok: true, checkout_url: json.checkout_url };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}
