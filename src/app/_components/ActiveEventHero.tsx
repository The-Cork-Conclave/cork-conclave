import Link from "next/link";
import Image from "next/image";
import { getActiveEvent } from "@/lib/event";

function formatEventDate(raw: string): string {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;

  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(d);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(d);
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${weekday} ${month} ${day}, ${time}`;
}

function formatNairaFromKoboString(amountInKobo: string): string {
  const kobo = Number.parseInt(amountInKobo, 10);
  if (!Number.isFinite(kobo)) return amountInKobo;
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

export default async function ActiveEventHero() {
  const event = await getActiveEvent();
  if (!event) return null;

  const bannerUrl = (event.image_url ?? "").trim();


  return (
    <div className="w-full flex flex-col md:flex-row gap-12 md:gap-4 items-center md:items-stretch justify-center 2xl:w-3/5">
      <div className="event-image-card md:flex-1 xl:w-1/3 2xl:w-full 2xl:min-w-[400px]!">
        {bannerUrl && bannerUrl.startsWith("/") ? (
          <Image
            src={bannerUrl}
            alt={event.name}
            fill
            sizes="(max-width: 900px) 400px, 360px"
            style={{ objectFit: "cover" }}
            priority
            quality={90}
          />
        ) : bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={event.name}
            fill
            sizes="(max-width: 900px) 400px, 360px"
            style={{ objectFit: "cover" }}
            priority
            quality={90}
          />
        ) : (
          <Image
            src="/images/backtotheroots.jpeg"
            alt={event.name}
            fill
            sizes="(max-width: 900px) 400px, 360px"
            style={{ objectFit: "cover" }}
            priority
            quality={90}
          />
        )}
      </div>

      <div className="event-details-card md:flex-1 xl:w-1/3 2xl:w-full">
        <span className="badge">Next Conclave</span>
        <h2 className="section-title">{event.name}</h2>
        <p className="muted">{event.description}</p>
        <div className="mt-4 space-y-2" style={{ color: "var(--text)" }}>
          <div className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80"
              style={{ color: "var(--text)" }}
            >
              <path d="M8 2v4M16 2v4" />
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span>{formatEventDate(event.event_date)}</span>
          </div>

          <div className="flex items-center gap-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80"
              style={{ color: "var(--text)" }}
            >
              <path d="M21 8V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1" />
              <path d="M21 12v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5" />
              <path d="M3 10h18" />
              <path d="M7 15h.01M11 15h2M7 19h.01M11 19h6" />
            </svg>
            <span>{formatNairaFromKoboString(event.amount_in_kobo)}</span>
          </div>
        </div>

        <div className="cta-row">
          <Link className="button" href='/event'>
            Save Your Spot
          </Link>
        </div>
      </div>
    </div>
  );
}

