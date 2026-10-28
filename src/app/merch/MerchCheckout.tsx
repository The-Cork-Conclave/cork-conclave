"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";

import {
  createMerchCheckout,
  type MerchCheckoutItem,
  type MerchProduct,
} from "@/lib/public-merch";

type CartLine = {
  id: string;
  productId: string;
  quantity: number;
  name: string;
  email: string;
  phone: string;
  colorLabel: string;
  size: string;
  fulfillment: "pickup" | "delivery";
  address: string;
  note: string;
};

const CART_KEY = "cork-merch-cart";
const LEGACY_SELECTED_KEY = "cork-merch-selected-product";
const LEGACY_DRAFT_PREFIX = "cork-merch-draft:";

function normalizeAddress(addr: string) {
  return addr.trim().toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

function formatNaira(kobo: number) {
  return `₦${Math.trunc(kobo / 100).toLocaleString()}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function newLine(product: MerchProduct): CartLine {
  return {
    id: `${product.id}-${Date.now()}`,
    productId: product.id,
    quantity: 1,
    name: "",
    email: "",
    phone: "",
    colorLabel: product.colors[0] ?? "",
    size: product.sizes[0] ?? "",
    fulfillment: "pickup",
    address: "",
    note: "",
  };
}

function sanitizeLine(line: CartLine, product: MerchProduct | undefined, index: number): CartLine | null {
  if (!product) return null;
  const colorLabel = product.colors.includes(line.colorLabel)
    ? line.colorLabel
    : (product.colors[0] ?? "");
  const size = product.sizes.includes(line.size) ? line.size : (product.sizes[0] ?? "");
  const quantity = Math.min(20, Math.max(1, Math.trunc(Number(line.quantity) || 1)));
  return {
    id: typeof line.id === "string" && line.id ? line.id : `${product.id}-${index}`,
    productId: product.id,
    quantity,
    name: typeof line.name === "string" ? line.name : "",
    email: typeof line.email === "string" ? line.email : "",
    phone: typeof line.phone === "string" ? line.phone : "",
    colorLabel,
    size,
    fulfillment: line.fulfillment === "delivery" ? "delivery" : "pickup",
    address: typeof line.address === "string" ? line.address : "",
    note: typeof line.note === "string" ? line.note : "",
  };
}

function loadCart(products: MerchProduct[]): CartLine[] {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { lines?: CartLine[] };
    if (!Array.isArray(parsed.lines)) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines: CartLine[] = [];
    for (let i = 0; i < parsed.lines.length; i++) {
      const line = parsed.lines[i];
      const cleaned = sanitizeLine(line, byId.get(line.productId), i);
      if (cleaned) lines.push(cleaned);
    }
    return lines;
  } catch {
    return [];
  }
}

function saveCart(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify({ lines }));
  } catch {
    // ignore quota / private mode
  }
}

export function clearMerchDrafts() {
  try {
    window.localStorage.removeItem(CART_KEY);
    window.localStorage.removeItem(LEGACY_SELECTED_KEY);
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(LEGACY_DRAFT_PREFIX)) toRemove.push(key);
    }
    for (let i = 0; i < toRemove.length; i++) {
      window.localStorage.removeItem(toRemove[i]);
    }
  } catch {
    // ignore
  }
}

function estimateTotal(lines: CartLine[], productsById: Map<string, MerchProduct>) {
  let total = 0;
  const feeByAddress = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const product = productsById.get(line.productId);
    if (!product) continue;
    total += product.price_in_kobo * line.quantity;
    if (line.fulfillment === "delivery") {
      const key = normalizeAddress(line.address);
      if (!key) continue;
      const prev = feeByAddress.get(key) ?? 0;
      if (product.delivery_fee_in_kobo > prev) {
        feeByAddress.set(key, product.delivery_fee_in_kobo);
      }
    }
  }

  feeByAddress.forEach((fee) => {
    total += fee;
  });
  return total;
}

type Props = {
  products: MerchProduct[];
  paymentSuccess?: boolean;
};

export function MerchCheckout({ products, paymentSuccess = false }: Props) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [pickingDesign, setPickingDesign] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const productsById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  useEffect(() => {
    if (paymentSuccess) {
      clearMerchDrafts();
      setLines([]);
      toast.success("Payment received. Thanks for your order!");
      window.history.replaceState({}, "", "/merch");
    } else {
      setLines(loadCart(products));
    }
    setDraftReady(true);
    // Success wipe runs once on mount; product list is SSR-stable for this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    saveCart(lines);
  }, [draftReady, lines]);

  const totalUnits = useMemo(
    () => lines.reduce((sum, line) => sum + line.quantity, 0),
    [lines],
  );
  const totalKobo = useMemo(() => estimateTotal(lines, productsById), [lines, productsById]);

  const productsInCart = useMemo(() => new Set(lines.map((l) => l.productId)), [lines]);
  const availableToAdd = products.filter((p) => !productsInCart.has(p.id));

  function updateLine(id: string, patch: Partial<CartLine>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  }

  function addDesign(product: MerchProduct) {
    setLines((prev) => {
      const units = prev.reduce((sum, line) => sum + line.quantity, 0);
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        const nextQty = Math.min(20, existing.quantity + 1);
        if (units - existing.quantity + nextQty > 20) {
          toast.error("You can order at most 20 shirts.");
          return prev;
        }
        return prev.map((line) =>
          line.id === existing.id ? { ...line, quantity: nextQty } : line,
        );
      }
      if (units >= 20) {
        toast.error("You can order at most 20 shirts.");
        return prev;
      }
      return [...prev, newLine(product)];
    });
    setPickingDesign(false);
  }

  function setQuantity(id: string, quantity: number) {
    const next = Math.min(20, Math.max(1, quantity));
    setLines((prev) => {
      const current = prev.find((line) => line.id === id);
      if (!current) return prev;
      const others = prev.reduce((sum, line) => sum + line.quantity, 0) - current.quantity;
      if (others + next > 20) {
        toast.error("You can order at most 20 shirts.");
        return prev;
      }
      return prev.map((line) => (line.id === id ? { ...line, quantity: next } : line));
    });
  }

  function validate(): string | null {
    if (lines.length < 1) return "Add at least one design.";
    if (totalUnits > 20) return "Please order at most 20 shirts total.";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const product = productsById.get(line.productId);
      const label = product?.name ?? `Design ${i + 1}`;
      if (!product) return `${label}: product is no longer available.`;
      if (!line.name.trim()) return `${label}: enter a name.`;
      if (!line.phone.trim()) return `${label}: enter a phone number.`;
      if (i === 0) {
        if (!line.email.trim() || !isValidEmail(line.email.trim())) {
          return `${label}: enter a valid email.`;
        }
      } else if (line.email.trim() && !isValidEmail(line.email.trim())) {
        return `${label}: enter a valid email or leave blank to use the first.`;
      }
      if (!line.colorLabel) return `${label}: choose a color.`;
      if (!line.size) return `${label}: choose a size.`;
      if (line.fulfillment === "delivery" && !line.address.trim()) {
        return `${label}: enter a delivery address.`;
      }
    }
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    const validation = validate();
    if (validation) {
      toast.error(validation);
      return;
    }

    const items: MerchCheckoutItem[] = lines.map((line, i) => {
      const email = line.email.trim().toLowerCase();
      const item: MerchCheckoutItem = {
        product_id: line.productId,
        quantity: line.quantity,
        recipient_name: line.name.trim(),
        recipient_phone: line.phone.trim(),
        color_label: line.colorLabel,
        size: line.size,
        fulfillment_type: line.fulfillment,
        delivery_address: line.fulfillment === "delivery" ? line.address.trim() : null,
        delivery_note: line.fulfillment === "delivery" && line.note.trim() ? line.note.trim() : null,
      };
      if (i === 0 || email) {
        item.recipient_email = email;
      }
      return item;
    });

    const toastId = toast.loading("Creating checkout…");
    setIsSubmitting(true);
    try {
      const result = await createMerchCheckout(items);
      if (!result.ok) {
        toast.error(result.error, { id: toastId });
        return;
      }
      toast.success("Redirecting to payment…", { id: toastId });
      window.location.assign(result.checkout_url);
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!draftReady) {
    return <p className="text-sm text-cork-blush">Loading…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl text-cork-cream md:text-4xl">Merch</h1>
          <p className="mt-2 text-sm text-cork-blush">Pick a design to get started.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addDesign(product)}
              className="overflow-hidden rounded-xl border border-white/10 bg-cork-plum-light/30 text-left transition hover:border-cork-coral/60"
            >
              <div className="relative aspect-square w-full bg-cork-plum-light/40">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 20rem"
                    unoptimized
                  />
                ) : null}
              </div>
              <div className="space-y-1 p-4">
                <p className="font-display text-lg text-cork-cream">{product.name}</p>
                <p className="text-sm text-cork-coral">{formatNaira(product.price_in_kobo)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-cork-cream md:text-4xl">Your order</h1>
        <p className="mt-2 text-sm text-cork-blush">
          Quantity for the same design. Add another design for a different shirt.
        </p>
      </div>

      <div className="space-y-6">
        {lines.map((line, index) => {
          const product = productsById.get(line.productId);
          if (!product) return null;
          return (
            <div
              key={line.id}
              className="grid gap-6 rounded-xl border border-white/10 bg-cork-plum-light/30 p-4 md:grid-cols-[12rem_1fr] md:p-5"
            >
              <div className="space-y-3">
                <div className="relative mx-auto aspect-square w-full max-w-[12rem] overflow-hidden rounded-xl bg-cork-plum-light/40">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="12rem"
                      unoptimized
                      priority={index === 0}
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-display text-xl text-cork-cream">{product.name}</p>
                  <p className="mt-1 text-sm text-cork-coral">
                    {formatNaira(product.price_in_kobo)} each
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs text-cork-blush">Qty</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.id, line.quantity - 1)}
                      disabled={line.quantity <= 1}
                      className="rounded-md border border-white/15 p-1.5 text-cork-blush disabled:opacity-40"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm text-cork-cream">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(line.id, line.quantity + 1)}
                      className="rounded-md border border-white/15 p-1.5 text-cork-blush"
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  {lines.length > 1 || availableToAdd.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                      className="text-cork-blush hover:text-cork-coral"
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-cork-blush">
                    Name
                    <input
                      value={line.name}
                      onChange={(e) => updateLine(line.id, { name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                      autoComplete="name"
                    />
                  </label>
                  <label className="block text-xs text-cork-blush">
                    Phone
                    <input
                      value={line.phone}
                      onChange={(e) => updateLine(line.id, { phone: e.target.value })}
                      className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                      autoComplete="tel"
                    />
                  </label>
                  <label className="block text-xs text-cork-blush sm:col-span-2">
                    Email{index === 0 ? "" : " (optional — uses first if blank)"}
                    <input
                      type="email"
                      value={line.email}
                      onChange={(e) => updateLine(line.id, { email: e.target.value })}
                      className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-xs text-cork-blush">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const selected = line.colorLabel === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => updateLine(line.id, { colorLabel: color })}
                          className={`rounded-md border px-3 py-1.5 text-xs ${
                            selected
                              ? "border-cork-coral text-cork-cream"
                              : "border-white/15 text-cork-blush hover:border-cork-coral/50"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-cork-blush">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const selected = line.size === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => updateLine(line.id, { size })}
                          className={`min-w-10 rounded-md border px-3 py-1.5 text-xs ${
                            selected
                              ? "border-cork-coral text-cork-cream"
                              : "border-white/15 text-cork-blush hover:border-cork-coral/50"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs text-cork-blush">Fulfillment</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateLine(line.id, { fulfillment: "pickup" })}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        line.fulfillment === "pickup"
                          ? "border-cork-coral text-cork-cream"
                          : "border-white/15 text-cork-blush"
                      }`}
                    >
                      Pickup (free)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLine(line.id, { fulfillment: "delivery" })}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        line.fulfillment === "delivery"
                          ? "border-cork-coral text-cork-cream"
                          : "border-white/15 text-cork-blush"
                      }`}
                    >
                      Delivery ({formatNaira(product.delivery_fee_in_kobo)})
                    </button>
                  </div>
                </div>

                {line.fulfillment === "pickup" && product.pickup_location ? (
                  <p className="rounded-md border border-white/10 bg-cork-plum/40 px-3 py-2 text-xs text-cork-blush">
                    Pickup at {product.pickup_location}
                  </p>
                ) : null}

                {line.fulfillment === "delivery" ? (
                  <div className="grid gap-3">
                    <label className="block text-xs text-cork-blush">
                      Delivery address
                      <textarea
                        value={line.address}
                        onChange={(e) => updateLine(line.id, { address: e.target.value })}
                        rows={2}
                        className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                      />
                    </label>
                    <label className="block text-xs text-cork-blush">
                      Note (optional)
                      <input
                        value={line.note}
                        onChange={(e) => updateLine(line.id, { note: e.target.value })}
                        placeholder="Landmark or description"
                        className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {availableToAdd.length > 0 ? (
        <div className="space-y-3">
          {!pickingDesign ? (
            <button
              type="button"
              onClick={() => setPickingDesign(true)}
              className="inline-flex items-center gap-2 text-sm text-cork-blush hover:text-cork-coral"
            >
              <Plus className="size-4" />
              Add another design
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-white/10 bg-cork-plum-light/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-cork-cream">Choose a design</p>
                <button
                  type="button"
                  onClick={() => setPickingDesign(false)}
                  className="text-xs text-cork-blush hover:text-cork-coral"
                >
                  Cancel
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addDesign(product)}
                    className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-cork-blush hover:border-cork-coral hover:text-cork-cream"
                  >
                    {product.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div className="text-cork-cream">
          <p>
            Total <span className="text-cork-coral">{formatNaira(totalKobo)}</span>
          </p>
          <p className="mt-1 text-xs text-cork-blush">
            {totalUnits} shirt{totalUnits === 1 ? "" : "s"}
            {" · "}
            delivery charged once per address
          </p>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-md bg-cork-coral px-5 py-2.5 text-sm font-medium text-cork-plum disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
          Continue to payment
        </button>
      </div>
    </form>
  );
}
