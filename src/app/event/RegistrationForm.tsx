"use client";

import { useMemo, useState, type CSSProperties } from "react";
import toast from "react-hot-toast";
import PhoneInput, { isValidPhoneNumber, type Value as PhoneValue } from "react-phone-number-input";

type Props = {
  className?: string;
  amountInKobo?: string | null;
};

function isFreeEventAmount(amountInKobo: string | null | undefined): boolean {
  if (amountInKobo == null) return true;
  const t = String(amountInKobo).trim();
  if (t === "") return true;
  const k = Number.parseInt(t, 10);
  return Number.isFinite(k) && k === 0;
}

function isValidEmail(email: string) {
  // Intentionally simple; backend remains source of truth.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type ApiErrorPayload = {
  message?: string;
};

function looksLikeTechnicalError(message: string): boolean {
  const m = message.toLowerCase();
  if (m.length > 240) return true;
  return (
    m.includes("sqlstate") ||
    m.includes("violates") ||
    m.includes("foreign key") ||
    m.includes("pq:") ||
    m.includes("rpc error") ||
    m.includes("panic:") ||
    m.includes("failed to create") ||
    m.includes("insert or update")
  );
}

/** Never surface raw server / DB strings to attendees. */
function userFacingRegistrationError(status: number, rawMessage: string): string {
  const raw = rawMessage.trim();

  if (status >= 500) {
    return "Something went wrong. Please try again.";
  }
  if (status === 404) {
    return "There is no event open for registration right now.";
  }
  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  if (status === 400) {
    if (!raw || looksLikeTechnicalError(raw)) {
      return "Something went wrong. Please check your details and try again.";
    }
    const lower = raw.toLowerCase();
    if (lower.includes("already registered")) {
      return "You're already registered for this event.";
    }
    return raw;
  }

  if (raw && !looksLikeTechnicalError(raw)) {
    return raw;
  }
  return "Something went wrong. Please try again.";
}

export default function RegistrationForm({ className, amountInKobo }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState<PhoneValue>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.trim() ?? "", []);
  const isFree = useMemo(() => isFreeEventAmount(amountInKobo), [amountInKobo]);

  const phoneShellStyle: CSSProperties = {
    color: "var(--text)",
    background: "rgba(208, 192, 226, 0.06)",
    border: "1px solid var(--border)",
    // Tune react-phone-number-input visuals to match the site palette.
    ["--PhoneInput-color--focus" as keyof CSSProperties]: "var(--text)",
    ["--PhoneInputCountryFlag-borderColor" as keyof CSSProperties]: "var(--border)",
    ["--PhoneInputCountryFlag-borderColor--focus" as keyof CSSProperties]: "var(--text)",
    ["--PhoneInputCountrySelectArrow-color" as keyof CSSProperties]: "var(--muted)",
    ["--PhoneInputCountrySelectArrow-color--focus" as keyof CSSProperties]: "var(--text)",
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

   
    let holdSubmittingUntilNavigation = false;

    const name = fullName.trim();
    const eMail = email.trim();
    const phoneNumber = (value ?? "").trim();

    if (!baseUrl) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    if (!name) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!eMail || !isValidEmail(eMail)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!phoneNumber) {
      toast.error("Please enter your phone number.");
      return;
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    const endpoint = `${baseUrl.replace(/\/$/, "")}/public/event/register`;

    const toastId = toast.loading(isFree ? "Registering…" : "Creating checkout…");
    setIsSubmitting(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: eMail,
          phone_number: phoneNumber,
        }),
      });

      if (!res.ok) {
        let rawMessage = "";
        try {
          const json = (await res.json()) as ApiErrorPayload;
          if (typeof json?.message === "string") rawMessage = json.message;
        } catch {
          // ignore JSON parse errors
        }
        toast.error(userFacingRegistrationError(res.status, rawMessage), { id: toastId });
        return;
      }

      const json = (await res.json()) as { checkout_url?: string };
      const checkoutUrl = (json.checkout_url ?? "").trim();

      if (isFree) {
        holdSubmittingUntilNavigation = true;
        toast.success("You're registered!", {
          id: toastId,
          duration: 6000,
        });
      
        setTimeout(() => {
          window.location.assign("/");
        }, 2500);
        return;
      }

      if (!checkoutUrl) {
        toast.error("Something went wrong. Please try again.", { id: toastId });
        return;
      }

      toast.success("Redirecting to checkout…", { id: toastId });
      window.location.assign(checkoutUrl);
    } catch {
      toast.error("Network error. Please try again.", { id: toastId });
    } finally {
      if (!holdSubmittingUntilNavigation) {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <form className={className ?? "space-y-5"} onSubmit={onSubmit}>
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          placeholder="Jane Doe"
          className="w-full px-3.5 py-2.5 rounded-xl text-sm"
          style={{
            color: "var(--text)",
            background: "rgba(208, 192, 226, 0.06)",
            border: "1px solid var(--border)",
            outline: "none",
          }}
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isSubmitting}
          autoComplete="name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
          Email Address
        </label>
        <input
          type="email"
          id="email"
          placeholder="jane@example.com"
          className="w-full px-3.5 py-2.5 rounded-xl text-sm"
          style={{
            color: "var(--text)",
            background: "rgba(208, 192, 226, 0.06)",
            border: "1px solid var(--border)",
            outline: "none",
          }}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
          Phone Number
        </label>
        <div className="w-full px-3.5 py-2 rounded-xl text-sm" style={phoneShellStyle}>
          <PhoneInput
            international
            defaultCountry="NG"
            placeholder="Enter phone number"
            value={value}
            onChange={setValue}
            disabled={isSubmitting}
            autoComplete="tel"
            numberInputProps={{
              id: "phone",
              name: "phone",
              required: true,
              className:
                "w-full bg-transparent text-sm outline-none border-0 p-0 focus:ring-0 focus:outline-none placeholder:text-[color:var(--muted)]",
            }}
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full button justify-center cursor-pointer"
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        >
          {isSubmitting
            ? isFree
              ? "Registering…"
              : "Redirecting…"
            : isFree
              ? "Register"
              : "Continue to Payment"}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="m13 5 7 7-7 7" />
          </svg>
        </button>
      </div>
    </form>
  );
}
