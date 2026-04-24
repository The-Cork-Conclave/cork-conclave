import { getActiveEvent } from "@/lib/event";
import NoEvent from "./NoEvent";
import { Calendar } from "lucide-react";
import Image from "next/image";

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

export default async function Event() {
  const event = await getActiveEvent();
  if (!event) return <NoEvent />;

  const ctaClosed = event.is_registration_cta_closed ?? false;

  const bannerUrl = (event.image_url ?? "").trim();

  return (
    <div className="lg:col-span-6 relative order-2 w-full mt-4 lg:mt-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full bg-linear-to-br from-[#e86a5e]/10 to-[#4a1c36]/20 blur-[80px] pointer-events-none z-0" />

      <div className="group relative w-full rounded-4xl border border-white/10 bg-[#11070e] overflow-hidden ring-1 ring-white/5 ring-inset shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-20px_rgba(232,106,94,0.15)] hover:ring-white/20 z-10 flex flex-col min-h-120 sm:min-h-130">
        <Image
          src={bannerUrl}
          alt="Back To The Roots"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-50 mix-blend-luminosity group-hover:mix-blend-normal"
        />

        <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#160811]/70 to-[#160811] z-0" />
        <div className="absolute inset-0 bg-linear-to-t from-[#11070e] via-[#11070e]/95 to-transparent h-full z-0" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full justify-end grow">
          <div className="mb-auto pb-24">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11070e]/80 backdrop-blur-md border border-white/10 text-white text-xs font-semibold tracking-widest uppercase shadow-xl ring-1 ring-white/5 group-hover:bg-[#11070e] transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e86a5e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e86a5e]"></span>
              </span>
              Next Conclave
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-auto">
            <div className="flex flex-col gap-2.5">
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white leading-[1.05] drop-shadow-lg transition-colors group-hover:text-[#f2e6ee]">
                {event.name}
              </h2>
              <p className="text-sm sm:text-base text-[#bba1b1] leading-relaxed font-light drop-shadow">
                {event.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#d1b3c4] border border-white/5 group-hover:bg-white/10 group-hover:text-white transition-colors shrink-0">
                  <Calendar />
                </div>
                <span className="text-sm font-medium text-[#f2e6ee] leading-tight drop-shadow-sm">
                  {formatEventDate(event.event_date)}
                </span>
              </div>
            </div>

            <div className="flex flex-row items-center justify-between gap-4 pt-1">
              <div className="flex flex-col">
                <span className="text-lg sm:text-3xl font-semibold text-white tracking-tight drop-shadow-md">
                  {formatNairaFromKoboString(event.amount_in_kobo)}{" "}
                  <span className="text-sm font-medium text-[#bba1b1] tracking-normal">/ guest</span>
                </span>
              </div>

              <div>
                <a
                  href={ctaClosed ? "/" : "/event"}
                  className="relative inline-flex items-center justify-center gap-2 px-3! py-2! sm:px-5! sm:py-3! button text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.15)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] group-hover:bg-[#f2e6ee] shrink-0"
                >
                  Save Your Spot
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
