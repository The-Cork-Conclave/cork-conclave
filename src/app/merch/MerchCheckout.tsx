"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";

import {
  createMerchCheckout,
  type MerchCheckoutItem,
  type MerchProduct,
} from "@/lib/public-merch";

type ShirtDraft = {
  id: string;
  name: string;
  email: string;
  phone: string;
  colorLabel: string;
  size: string;
  fulfillment: "pickup" | "delivery";
  address: string;
  note: string;
};

function newShirt(product: MerchProduct, index: number): ShirtDraft {
  return {
    id: `${Date.now()}-${index}`,
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatNaira(kobo: number) {
  return `₦${Math.trunc(kobo / 100).toLocaleString()}`;
}

type Props = {
  product: MerchProduct;
};

export function MerchCheckout({ product }: Props) {
  const [shirts, setShirts] = useState<ShirtDraft[]>(() => [newShirt(product, 0)]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalKobo = useMemo(() => {
    return shirts.reduce((sum, s) => {
      const fee = s.fulfillment === "delivery" ? product.delivery_fee_in_kobo : 0;
      return sum + product.price_in_kobo + fee;
    }, 0);
  }, [product.delivery_fee_in_kobo, product.price_in_kobo, shirts]);

  function updateShirt(id: string, patch: Partial<ShirtDraft>) {
    setShirts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function copyFromFirst(id: string) {
    const first = shirts[0];
    if (!first || first.id === id) return;
    updateShirt(id, {
      name: first.name,
      email: first.email,
      phone: first.phone,
      fulfillment: first.fulfillment,
      address: first.address,
      note: first.note,
    });
  }

  function validate(): string | null {
    if (shirts.length < 1) return "Add at least one shirt.";
    for (let i = 0; i < shirts.length; i++) {
      const s = shirts[i];
      const label = `Shirt ${i + 1}`;
      if (!s.name.trim()) return `${label}: enter a name.`;
      if (!s.phone.trim()) return `${label}: enter a phone number.`;
      if (i === 0) {
        if (!s.email.trim() || !isValidEmail(s.email.trim())) {
          return `${label}: enter a valid email.`;
        }
      } else if (s.email.trim() && !isValidEmail(s.email.trim())) {
        return `${label}: enter a valid email or leave blank to use the first.`;
      }
      if (!s.colorLabel) return `${label}: choose a color.`;
      if (!s.size) return `${label}: choose a size.`;
      if (s.fulfillment === "delivery" && !s.address.trim()) {
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

    const items: MerchCheckoutItem[] = shirts.map((s, i) => {
      const email = s.email.trim().toLowerCase();
      const item: MerchCheckoutItem = {
        product_id: product.id,
        recipient_name: s.name.trim(),
        recipient_phone: s.phone.trim(),
        color_label: s.colorLabel,
        size: s.size,
        fulfillment_type: s.fulfillment,
        delivery_address: s.fulfillment === "delivery" ? s.address.trim() : null,
        delivery_note: s.fulfillment === "delivery" && s.note.trim() ? s.note.trim() : null,
      };
      if (i === 0 || email) {
        item.recipient_email = i === 0 ? email : email;
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

  return (
    <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="space-y-6">
        <div className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-2xl bg-cork-plum-light/40">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 28rem"
              unoptimized
              priority
            />
          ) : null}
        </div>
        <div>
          <h1 className="font-display text-3xl text-cork-cream md:text-4xl">{product.name}</h1>
          {product.description ? (
            <p className="mt-3 text-sm leading-relaxed text-cork-blush/90">{product.description}</p>
          ) : null}
          <p className="mt-4 text-lg text-cork-coral">{formatNaira(product.price_in_kobo)} each</p>
        </div>
      </div>

      <div className="space-y-6">
        {shirts.map((shirt, index) => (
          <div
            key={shirt.id}
            className="space-y-4 rounded-xl border border-white/10 bg-cork-plum-light/30 p-4 md:p-5"
          >
            {index > 0 || shirts.length > 1 ? (
              <div className="flex items-center justify-end gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() => copyFromFirst(shirt.id)}
                    className="inline-flex items-center gap-1.5 text-xs text-cork-blush hover:text-cork-coral"
                  >
                    <Copy className="size-3.5" />
                    Same as first
                  </button>
                ) : null}
                {shirts.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setShirts((prev) => prev.filter((s) => s.id !== shirt.id))}
                    className="text-cork-blush hover:text-cork-coral"
                    aria-label="Remove this shirt"
                  >
                    <Trash2 className="size-4" />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-cork-blush">
                Name
                <input
                  value={shirt.name}
                  onChange={(e) => updateShirt(shirt.id, { name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                  autoComplete="name"
                />
              </label>
              <label className="block text-xs text-cork-blush">
                Phone
                <input
                  value={shirt.phone}
                  onChange={(e) => updateShirt(shirt.id, { phone: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                  autoComplete="tel"
                />
              </label>
              <label className="block text-xs text-cork-blush sm:col-span-2">
                Email{index === 0 ? "" : " (optional — uses first if blank)"}
                <input
                  type="email"
                  value={shirt.email}
                  onChange={(e) => updateShirt(shirt.id, { email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                  autoComplete="email"
                />
              </label>
            </div>

            <div>
              <p className="mb-2 text-xs text-cork-blush">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const selected = shirt.colorLabel === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => updateShirt(shirt.id, { colorLabel: color })}
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
                  const selected = shirt.size === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateShirt(shirt.id, { size })}
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
                  onClick={() => updateShirt(shirt.id, { fulfillment: "pickup" })}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    shirt.fulfillment === "pickup"
                      ? "border-cork-coral text-cork-cream"
                      : "border-white/15 text-cork-blush"
                  }`}
                >
                  Pickup (free)
                </button>
                <button
                  type="button"
                  onClick={() => updateShirt(shirt.id, { fulfillment: "delivery" })}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    shirt.fulfillment === "delivery"
                      ? "border-cork-coral text-cork-cream"
                      : "border-white/15 text-cork-blush"
                  }`}
                >
                  Delivery ({formatNaira(product.delivery_fee_in_kobo)})
                </button>
              </div>
            </div>

            {shirt.fulfillment === "pickup" && product.pickup_location ? (
              <p className="rounded-md border border-white/10 bg-cork-plum/40 px-3 py-2 text-xs text-cork-blush">
                Pickup at {product.pickup_location}
              </p>
            ) : null}

            {shirt.fulfillment === "delivery" ? (
              <div className="grid gap-3">
                <label className="block text-xs text-cork-blush">
                  Delivery address
                  <textarea
                    value={shirt.address}
                    onChange={(e) => updateShirt(shirt.id, { address: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                  />
                </label>
                <label className="block text-xs text-cork-blush">
                  Note (optional)
                  <input
                    value={shirt.note}
                    onChange={(e) => updateShirt(shirt.id, { note: e.target.value })}
                    placeholder="Landmark or description"
                    className="mt-1 w-full rounded-md border border-white/10 bg-cork-plum/60 px-3 py-2 text-sm text-cork-cream outline-none focus:border-cork-coral"
                  />
                </label>
              </div>
            ) : null}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setShirts((prev) => [...prev, newShirt(product, prev.length)])}
          className="inline-flex items-center gap-2 text-sm text-cork-blush hover:text-cork-coral"
        >
          <Plus className="size-4" />
          Add another shirt
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <p className="text-cork-cream">
            Total <span className="text-cork-coral">{formatNaira(totalKobo)}</span>
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-md bg-cork-coral px-5 py-2.5 text-sm font-medium text-cork-plum disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue to payment
          </button>
        </div>
      </div>
    </form>
  );
}
