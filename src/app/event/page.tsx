import Image from "next/image";
import { redirect } from "next/navigation";
import { getActiveEvent } from "@/lib/event";
import { formatDateTime } from "@/lib/helpers";
import RegistrationForm from "./RegistrationForm";

function formatNairaFromKoboString(amountInKobo: string): string {
  const kobo = Number.parseInt(amountInKobo, 10);
  if (!Number.isFinite(kobo)) return amountInKobo;
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

function MetaRow({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div
        className="shrink-0 mt-0.5 flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          lineHeight: 0,
          color: "var(--text)",
          background: "rgba(208, 192, 226, 0.08)",
          border: "1px solid var(--border)",
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
          {title}
        </div>
        <div className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function Page() {
  const event = await getActiveEvent();
  if (!event) {
    redirect("/");
  }

  const bannerUrl = (event.image_url ?? "").trim();
  const dateTime = formatDateTime(event.event_date);
  const price = formatNairaFromKoboString(event.amount_in_kobo);

  return (
    <main
      className="section"
      style={{
        paddingTop: 56,
        background: "var(--bg)",
      }}
    >
      <div className="container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* Event Card */}
          <div className="card overflow-hidden p-0!">
            {/* Banner Image */}
            <div
              className="w-full relative"
              style={{
                height: 260,
                background: "rgba(208, 192, 226, 0.08)",
              }}
            >
              {bannerUrl ? (
                <Image
                  src={bannerUrl}
                  alt={event.name}
                  fill
                  sizes="(max-width: 1024px) 92vw, 760px"
                  style={{ objectFit: "cover" }}
                  priority
                  quality={90}
                />
              ) : (
                <Image
                  src="/images/backtotheroots.jpeg"
                  alt={event.name}
                  fill
                  sizes="(max-width: 1024px) 92vw, 760px"
                  style={{ objectFit: "cover" }}
                  priority
                  quality={90}
                />
              )}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(0,0,0,0.28), transparent)",
                }}
              />
            </div>

            {/* Event Content */}
            <div className="p-6 sm:p-8 flex flex-col gap-6">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3" style={{ color: "var(--text)" }}>
                {event.name}
              </h1>

              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted)" }}>
                {event.description}
              </p>

              {/* Meta Details */}
              <div className="space-y-5">
                <MetaRow
                  title="Date"
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      className="block shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 2v4M16 2v4" />
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M3 10h18" />
                    </svg>
                  }
                >
                  {dateTime}
                </MetaRow>

                <MetaRow
                  title="Host"
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      className="block shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  }
                >
                  {event.created_by}
                </MetaRow>

                <MetaRow
                  title="Ticket Fee"
                  icon={
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      className="block shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.59 13.41 11 3.83V2h-2v3L3.41 13.41a2 2 0 0 0 0 2.83l4.35 4.35a2 2 0 0 0 2.83 0L20.59 16.24a2 2 0 0 0 0-2.83Z" />
                      <path d="M7 7h.01" />
                    </svg>
                  }
                >
                  {price}
                </MetaRow>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Registration Form */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-8 card">
            <div className="mb-8 flex flex-col gap-2">
              <p className="text-2xl font-semibold" style={{ color: "var(--text)" }}>
                Register for this event
              </p>

              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Fill in your details to secure your spot.
              </p>
            </div>

            <RegistrationForm className="space-y-5" amountInKobo={event.amount_in_kobo} />

            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex items-center justify-center gap-1.5 mb-2" style={{ color: "var(--muted)" }}>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-xs font-medium">Your information is secure</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}