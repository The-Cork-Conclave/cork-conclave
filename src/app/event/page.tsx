import Image from "next/image";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getActiveEvent, getActiveEventQuestions } from "@/lib/event";
import { EVENT_DISPLAY_TIMEZONE } from "@/lib/timezone";
import InviteRegistrationPanel from "./InviteRegistrationPanel";
import { PaymentSuccessCelebration } from "./PaymentSuccessCelebration";
import RegistrationPanel from "./RegistrationPanel";

function formatNairaFromKoboString(amountInKobo: string): string {
  const kobo = Number.parseInt(amountInKobo, 10);
  if (!Number.isFinite(kobo)) return amountInKobo;
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(naira);
}

function formatEventDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: EVENT_DISPLAY_TIMEZONE,
  }).format(d);
}

function formatEventTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
    timeZone: EVENT_DISPLAY_TIMEZONE,
  }).format(d);
}


function optimizedBannerUrl(url: string): string {
  if (!url) return "";
  return url.includes("?") ? `${url}&q=80&w=1600&auto=format` : `${url}?q=80&w=1600&auto=format`;
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-gray-300 uppercase tracking-widest font-semibold">{label}</span>
      <span className="text-white font-medium text-sm md:text-base">{children}</span>
    </div>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim() ?? "";

  const event = await getActiveEvent();
  if (!event || event.is_registration_cta_closed) {
    redirect("/");
  }

  const questions = await getActiveEventQuestions();
  const bannerUrl = (event.image_url ?? "").trim();
  const eventDate = formatEventDate(event.event_date);
  const eventTime = formatEventTime(event.event_date);
  const price = formatNairaFromKoboString(event.amount_in_kobo);

  return (
    <main className="relative z-10 grow flex flex-col justify-center py-6 lg:py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <PaymentSuccessCelebration />
      </Suspense>
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[min(1200px,100vw)] h-200 bg-linear-to-b from-[#3a1018]/30 via-[#2b1d2e]/10 to-transparent blur-[120px]"
        aria-hidden
      />

      <article className="relative w-full flex flex-col max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 w-full items-start">
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="w-full max-w-sm sm:max-w-md rounded-4xl overflow-hidden shadow-2xl border border-white/10">
              {bannerUrl ? (
                <Image
                  src={optimizedBannerUrl(bannerUrl)}
                  alt={event.name}
                  width={800}
                  height={1067}
                  sizes="(min-width: 640px) 400px, 92vw"
                  className="h-auto w-full"
                  priority
                />
              ) : (
                <div className="aspect-3/4 w-full bg-linear-to-br from-[#2a0f1d] via-[#11070e] to-transparent" />
              )}
            </div>

            <div className="flex flex-col gap-4">
               <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-none">
                {event.name}
              </h1>

             {event.description ? (
  <div className="mt-6 space-y-4">
    {event.description.split("\n\n").map((paragraph, index) => (
      <p
        key={index}
        className="text-sm leading-relaxed font-light md:text-base"
        style={{ color: "var(--muted)" }}
      >
        {paragraph}
      </p>
    ))}
  </div>
) : null}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-5 border-t border-white/10 mt-1 pb-4">
                <MetaItem label="Date">{eventDate}</MetaItem>
                <MetaItem label="Time">{eventTime}</MetaItem>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-300 uppercase tracking-widest font-semibold">Ticket</span>
                  <span className="text-[#ff545a] font-medium text-sm md:text-base">
                    {inviteToken ? "Complimentary invite" : price}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white/3 backdrop-blur-3xl border border-white/8 rounded-4xl p-6 lg:p-8 flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative max-h-[85vh] overflow-y-auto lg:sticky lg:top-8 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]">
              {inviteToken ? (
                <InviteRegistrationPanel token={inviteToken} />
              ) : (
                <RegistrationPanel amountInKobo={event.amount_in_kobo} questions={questions} />
              )}
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
