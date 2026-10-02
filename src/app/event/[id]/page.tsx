"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronDown, Copy, Star, Ticket, Wine, X } from "lucide-react";
import {
  cloudinaryDisplayUrl,
  fetchPublicEventTicket,
  fetchPublicEventWineDetail,
  fetchPublicEventWines,
  subscribePublicEventStream,
  upsertPublicWineReview,
  type PublicEventTicketResponse,
  type PublicEventWineDetailResponse,
  type PublicEventWineListItem,
  type WineReviewItem,
} from "@/lib/public-ticket";
import { EVENT_DISPLAY_TIMEZONE } from "@/lib/timezone";

type WineCardStatus = "sampling" | "reviewed" | "not_reviewed";

function formatEventWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: EVENT_DISPLAY_TIMEZONE,
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: EVENT_DISPLAY_TIMEZONE,
  });
}

function relativeTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function wineStatus(wine: PublicEventWineListItem, samplingId: string | null): WineCardStatus {
  if (wine.reviewed_by_user) return "reviewed";
  if (samplingId && wine.event_wine_id === samplingId) return "sampling";
  return "not_reviewed";
}

function starFill(rating: number, index: number): "full" | "half" | "empty" {
  const threshold = index + 1;
  if (rating >= threshold) return "full";
  if (rating >= threshold - 0.5) return "half";
  return "empty";
}

function StarIcon({
  fill,
  className,
}: {
  fill: "full" | "half" | "empty";
  className: string;
}) {
  if (fill === "full") {
    return <Star className={`${className} fill-cork-coral text-cork-coral`} strokeWidth={1.5} />;
  }
  if (fill === "half") {
    return (
      <span className={`relative inline-flex ${className}`}>
        <Star className={`${className} text-cork-blush/30`} strokeWidth={1.5} />
        <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
          <Star className={`${className} fill-cork-coral text-cork-coral`} strokeWidth={1.5} />
        </span>
      </span>
    );
  }
  return <Star className={`${className} text-cork-blush/30`} strokeWidth={1.5} />;
}

function StarRow({
  rating,
  size = "sm",
  interactive = false,
  value = null,
  onChange,
}: {
  rating?: number;
  size?: "sm" | "lg";
  interactive?: boolean;
  value?: number | null;
  onChange?: (n: number | null) => void;
}) {
  const display = interactive ? (value ?? 0) : (rating ?? 0);
  const iconClass = size === "lg" ? "h-8 w-8" : "h-3.5 w-3.5";

  if (interactive) {
    const select = (next: number) => {
      onChange?.(value === next ? null : next);
    };
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }, (_, i) => {
            const fullValue = i + 1;
            const halfValue = i + 0.5;
            const fill = starFill(value ?? 0, i);
            return (
              <span key={fullValue} className={`relative inline-flex ${iconClass}`}>
                <StarIcon fill={fill} className={iconClass} />
                <button
                  type="button"
                  aria-label={`Rate ${halfValue} stars`}
                  onClick={() => select(halfValue)}
                  className="absolute inset-y-0 left-0 z-10 w-1/2"
                />
                <button
                  type="button"
                  aria-label={`Rate ${fullValue} stars`}
                  onClick={() => select(fullValue)}
                  className="absolute inset-y-0 right-0 z-10 w-1/2"
                />
              </span>
            );
          })}
        </div>
        <p className="text-xs text-cork-blush/60">
          {value == null ? "No stars selected — submit to rate 0." : `${value.toFixed(1)} selected. Click again to clear.`}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 text-cork-coral">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon key={i} fill={starFill(display, i)} className={iconClass} />
      ))}
    </div>
  );
}

function statusBadge(status: WineCardStatus) {
  if (status === "sampling") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cork-coral/10 px-2.5 py-1 text-[9px] font-medium tracking-widest text-cork-coral uppercase">
        Currently Sampling
      </span>
    );
  }
  if (status === "reviewed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-medium tracking-widest text-emerald-300 uppercase">
        Reviewed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-medium tracking-widest text-cork-blush uppercase">
      Not Reviewed
    </span>
  );
}

function EventTicketPageInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const eventId = typeof params.id === "string" ? params.id : "";
  const ticketToken = (searchParams.get("ticket") ?? "").trim();

  const [ticketData, setTicketData] = useState<PublicEventTicketResponse | null>(null);
  const [wines, setWines] = useState<PublicEventWineListItem[]>([]);
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
  const [wineDetail, setWineDetail] = useState<PublicEventWineDetailResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastWine, setToastWine] = useState<string | null>(null);

  const samplingWine = useMemo(() => (wines.length > 0 ? wines[0] : null), [wines]);
  const samplingId = samplingWine?.event_wine_id ?? null;
  const featuredWine = useMemo(() => {
    if (!selectedWineId) return samplingWine;
    return wines.find((w) => w.event_wine_id === selectedWineId) ?? samplingWine;
  }, [selectedWineId, wines, samplingWine]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const loadWines = useCallback(async (opts?: { selectNewest?: boolean; toastNewest?: boolean }) => {
    if (!eventId || !ticketToken) return;
    const result = await fetchPublicEventWines(eventId, ticketToken);
    if (!result.ok) {
      setLoadError(
        result.status === 404
          ? "This ticket link is invalid or expired. Please use the link from your confirmation email."
          : "Failed to load wines. Please try again.",
      );
      return;
    }
    setWines(result.data.wines);
    if (result.data.wines.length > 0) {
      const newest = result.data.wines[0];
      if (opts?.selectNewest) {
        setSelectedWineId(newest.event_wine_id);
      } else {
        setSelectedWineId((prev) => prev ?? newest.event_wine_id);
      }
      if (opts?.toastNewest) {
        setToastWine(newest.name);
      }
    }
  }, [eventId, ticketToken]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!eventId) {
        setLoadError("Missing event.");
        setLoading(false);
        return;
      }
      if (!ticketToken) {
        setLoadError("Open this page from the View Ticket link in your confirmation email.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      const ticketResult = await fetchPublicEventTicket(eventId, ticketToken);
      if (cancelled) return;

      if (!ticketResult.ok) {
        setLoadError(
          ticketResult.status === 404
            ? "This ticket link is invalid or expired. Please use the link from your confirmation email."
            : "Failed to load your ticket. Please try again.",
        );
        setLoading(false);
        return;
      }

      setTicketData(ticketResult.data);
      await loadWines();
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, ticketToken, loadWines]);

  useEffect(() => {
    if (!eventId || !ticketToken || !ticketData) return;

    return subscribePublicEventStream(eventId, ticketToken, {
      onWineAdded: () => {
        void loadWines({ selectNewest: true, toastNewest: true });
      },
      onWineUpdated: (payload) => {
        void loadWines();
        void fetchPublicEventWineDetail(eventId, payload.event_wine_id, ticketToken).then((detail) => {
          if (!detail.ok) return;
          setWineDetail((prev) => (prev?.event_wine_id === payload.event_wine_id ? detail.data : prev));
        });
      },
      onWineReviewed: (payload) => {
        setWines((prev) =>
          prev.map((w) => {
            if (w.event_wine_id !== payload.event_wine_id) return w;
            return {
              ...w,
              average_rating: payload.average_rating ?? w.average_rating,
              review_count: payload.review_count ?? w.review_count,
            };
          }),
        );
        void (async () => {
          // Refresh open wine detail if it matches the reviewed wine.
          setWineDetail((prev) => {
            if (!prev || prev.event_wine_id !== payload.event_wine_id) return prev;
            void fetchPublicEventWineDetail(eventId, payload.event_wine_id, ticketToken).then((detail) => {
              if (detail.ok) setWineDetail(detail.data);
            });
            return prev;
          });
        })();
      },
    });
  }, [eventId, ticketToken, ticketData, loadWines]);  useEffect(() => {
    if (!eventId || !ticketToken || !featuredWine) {
      setWineDetail(null);
      return;
    }

    let cancelled = false;
    async function loadDetail() {
      const result = await fetchPublicEventWineDetail(eventId, featuredWine!.event_wine_id, ticketToken);
      if (cancelled) return;
      if (!result.ok) {
        setWineDetail(null);
        return;
      }
      setWineDetail(result.data);
      setMyRating(result.data.my_review ? result.data.my_review.rating : null);
      setNotes(result.data.my_review?.comment ?? "");
      setSubmitError(null);
    }
    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [eventId, ticketToken, featuredWine?.event_wine_id]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!toastWine) return;
    const show = window.setTimeout(() => setShowToast(true), 800);
    const hide = window.setTimeout(() => setShowToast(false), 6000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [toastWine]);

  async function copyAccessCode() {
    const code = ticketData?.ticket.access_code;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function submitReview() {
    if (!eventId || !ticketToken || !featuredWine) return;
    setSubmitting(true);
    setSubmitError(null);
    const rating = myRating ?? 0;
    const comment = notes.trim() ? notes.trim() : null;
    const result = await upsertPublicWineReview(eventId, featuredWine.event_wine_id, ticketToken, {
      rating,
      comment,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError("Could not save your review. Please try again.");
      return;
    }

    const reviewedWineId = featuredWine.event_wine_id;
    setWines((prev) =>
      prev.map((w) => {
        if (w.event_wine_id !== reviewedWineId) return w;
        const nextCount = w.reviewed_by_user ? w.review_count : w.review_count + 1;
        const nextAverage = w.reviewed_by_user
          ? w.average_rating
          : (w.average_rating * w.review_count + rating) / Math.max(1, nextCount);
        return {
          ...w,
          reviewed_by_user: true,
          my_rating: rating,
          review_count: nextCount,
          average_rating: Math.round(nextAverage * 10) / 10,
        };
      }),
    );
    setMyRating(null);
    setNotes("");
    setSubmitError(null);

    await loadWines();
    const detail = await fetchPublicEventWineDetail(eventId, reviewedWineId, ticketToken);
    if (detail.ok) {
      setWineDetail(detail.data);
      // Keep the form cleared after a successful submit; re-selecting the wine will reload notes.
      setMyRating(null);
      setNotes("");
    }
  }

  function selectWine(wineId: string) {
    setSelectedWineId(wineId);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-cork-blush">
        Loading your ticket…
      </div>
    );
  }

  if (loadError || !ticketData) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center">
        <Ticket className="h-10 w-10 text-cork-coral" strokeWidth={1.5} aria-hidden />
        <h1 className="font-serif text-2xl text-cork-cream">Ticket unavailable</h1>
        <p className="text-sm text-cork-blush">{loadError}</p>
      </div>
    );
  }

  const { event, ticket } = ticketData;
  const heroImage =
    event.image_url ||
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2940&auto=format&fit=crop";
  const reviews: WineReviewItem[] = wineDetail?.reviews ?? [];
  const registrationDate = ticket.registration_confirmed_at ?? ticket.created_at;

  return (
    <div className="relative z-10 overflow-x-hidden pb-24 selection:bg-cork-coral selection:text-cork-white">
      <section className="mx-auto mb-12 max-w-6xl px-4 md:px-12">
        <div className="group relative aspect-4/5 overflow-hidden rounded-[2.5rem] bg-cork-plum-light sm:aspect-16/9 md:aspect-21/9">
          <img
            src={heroImage}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-500 group-hover:scale-105 group-hover:opacity-70"
          />
          <div className="absolute inset-0 bg-linear-to-t from-cork-plum via-cork-plum/50 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
            <div className="mb-4 flex flex-wrap items-center gap-3 md:mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cork-coral/30 bg-cork-coral/20 px-3 py-1 text-xs font-medium text-red-50 backdrop-blur-md">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cork-coral" />
                {event.status === "active" || event.status === "live" ? "Live Now" : event.status}
              </span>
              <span className="text-sm font-medium tracking-wide text-cork-cream/80">
                {formatEventWhen(event.event_date)}
                {event.venue_name ? ` • ${event.venue_name}` : ""}
              </span>
            </div>
            <h1 className="mb-3 font-serif text-4xl tracking-tight text-cork-white md:text-5xl lg:text-6xl">
              {event.name}
            </h1>
            {event.description ? (
              <p className="max-w-xl text-sm font-light leading-relaxed text-cork-blush md:text-base">
                {event.description}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto mb-20 max-w-4xl -mt-16 px-4 md:-mt-24 md:px-12">
        <div className="flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-cork-plum-light/50 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:flex-row">
          <div className="flex-1 bg-cork-plum-light/30 p-8 md:p-10">
            <div className="mb-8 flex items-center gap-2 text-cork-coral">
              <Ticket className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              <span className="text-xs font-medium tracking-[0.2em] uppercase">Digital Access Pass</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              <div>
                <p className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">Ticket Holder</p>
                <p className="text-lg font-medium tracking-tight text-cork-cream">{ticket.holder_name}</p>
              </div>
              <div>
                <p className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">Registration</p>
                <p className="text-base font-medium tracking-tight text-cork-blush">
                  {formatShortDate(registrationDate)}
                </p>
              </div>
              {event.dress_code ? (
                <div className="col-span-2">
                  <p className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">Dress code</p>
                  <p className="text-base font-medium tracking-tight text-cork-blush">{event.dress_code}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative hidden w-px items-center justify-center border-l-2 border-dashed border-white/10 bg-transparent md:flex">
            <div className="absolute -top-4 -ml-[17px] h-8 w-8 rounded-full bg-cork-plum shadow-inner" />
            <div className="absolute -bottom-4 -ml-[17px] h-8 w-8 rounded-full bg-cork-plum shadow-inner" />
          </div>
          <div className="relative mx-6 flex h-px items-center justify-center border-t-2 border-dashed border-white/10 md:hidden">
            <div className="absolute -left-10 -mt-[17px] h-8 w-8 rounded-full bg-cork-plum shadow-inner" />
            <div className="absolute -right-10 -mt-[17px] h-8 w-8 rounded-full bg-cork-plum shadow-inner" />
          </div>

          <div className="flex shrink-0 flex-col items-center justify-center bg-white/3 p-8 md:w-80 md:p-10">
            <div className="mb-6 rounded-2xl border border-white/10 bg-cork-cream p-4 shadow-sm">
              {ticket.qr_image_url ? (
                <img
                  src={ticket.qr_image_url}
                  alt="Entry QR code"
                  className="h-32 w-32 object-contain"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center text-xs text-cork-plum/50">QR pending</div>
              )}
            </div>
            <p className="mb-2.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">Access Code</p>
            <button
              type="button"
              onClick={copyAccessCode}
              className="group flex w-full cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2 shadow-sm transition-colors hover:border-white/20"
            >
              <span className="font-mono text-sm font-medium tracking-[0.15em] text-cork-cream">
                {ticket.access_code}
              </span>
              <Copy className="h-4 w-4 text-cork-blush/60 group-hover:text-cork-coral" strokeWidth={1.5} />
            </button>
            {copied ? <p className="mt-2 text-xs text-cork-coral">Copied</p> : null}
          </div>
        </div>
      </section>

      {featuredWine ? (
        <section className="mx-auto mb-24 max-w-6xl px-4 md:px-12">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="mb-2 font-serif text-3xl tracking-tight text-cork-cream md:text-4xl">
                {featuredWine.event_wine_id === samplingId ? "Currently Being Sampled" : "Wine Details"}
              </h2>
              <p className="text-sm font-medium text-cork-blush">
                {event.status === "completed"
                  ? "Event ended — you can still rate the wines."
                  : "Updates as the host introduces new wines."}
              </p>
            </div>
            {featuredWine.event_wine_id === samplingId ? (
              <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-cork-coral/20 bg-cork-coral/10 px-3 py-1.5 text-xs font-medium text-cork-coral">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cork-coral" />
                Active Pour
              </div>
            ) : null}
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-cork-plum-light/40 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-md md:p-12">
            <div className="pointer-events-none absolute top-0 right-0 -mt-40 -mr-40 h-96 w-96 rounded-full bg-cork-coral/5 blur-3xl" />

            <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="relative flex aspect-3/4 items-center justify-center overflow-hidden rounded-3xl bg-cork-plum/60 p-10 lg:col-span-5 lg:aspect-auto">
                <div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent" />
                {featuredWine.image_url ? (
                  <img
                    src={cloudinaryDisplayUrl(featuredWine.image_url)}
                    alt={featuredWine.name}
                    className="relative z-10 h-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <Wine className="relative z-10 h-24 w-24 text-cork-blush/40" strokeWidth={1.5} />
                )}
              </div>

              <div className="flex flex-col justify-center lg:col-span-7">
                <div className="mb-3">
                  <span className="text-[10px] font-medium tracking-[0.2em] text-cork-blush/60 uppercase">
                    {[featuredWine.region, featuredWine.country].filter(Boolean).join(", ") ||
                      featuredWine.wine_type}
                  </span>
                </div>

                <h3 className="mb-3 font-serif text-4xl tracking-tight text-cork-cream md:text-5xl">
                  {featuredWine.name}
                </h3>
                <p className="mb-8 text-lg font-medium text-cork-blush">{featuredWine.wine_type}</p>

                <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-6 border-b border-white/10 pb-8 sm:flex sm:flex-wrap">
                  <div className="flex flex-col">
                    <span className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">Producer</span>
                    <span className="text-sm font-medium text-cork-cream">{featuredWine.producer}</span>
                  </div>
                  <div className="hidden w-px bg-white/10 sm:block" />
                  <div className="flex flex-col">
                    <span className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">
                      Community Rating
                    </span>
                    <button
                      type="button"
                      onClick={openDrawer}
                      className="group flex cursor-pointer items-center gap-1.5"
                    >
                      <Star className="h-4 w-4 fill-cork-coral text-cork-coral" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm font-medium text-cork-cream transition-colors group-hover:text-cork-coral">
                        {featuredWine.average_rating.toFixed(1)}{" "}
                        <span className="ml-1 font-normal text-cork-blush/60 underline decoration-white/20 underline-offset-4">
                          {featuredWine.review_count} reviews
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-cork-plum/50 p-6 shadow-sm md:p-8">
                  <div className="mb-5 flex items-center justify-between">
                    <h4 className="font-medium tracking-tight text-cork-cream">My Review</h4>
                    <span className="text-xs text-cork-blush/60">Stars are optional.</span>
                  </div>

                  <div className="mb-6">
                    <StarRow interactive size="lg" value={myRating} onChange={setMyRating} />
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your tasting notes (optional)..."
                    className="mb-5 h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-light text-cork-cream shadow-sm transition-all placeholder:text-cork-blush/40 focus:border-cork-coral focus:ring-1 focus:ring-cork-coral focus:outline-none"
                  />

                  {submitError ? <p className="mb-3 text-sm text-cork-coral">{submitError}</p> : null}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void submitReview()}
                    className="w-full rounded-full bg-cork-coral px-8 py-3 text-sm font-medium text-cork-white shadow-md shadow-cork-coral/20 transition-colors hover:bg-cork-coral-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {submitting ? "Saving…" : featuredWine.reviewed_by_user ? "Update Review" : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto mb-12 max-w-6xl px-4 md:px-12">
        <h2 className="mb-8 font-serif text-2xl tracking-tight text-cork-cream md:text-3xl">Wines Sampled Tonight</h2>

        {wines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 p-12 text-center opacity-70">
            <Wine className="mb-3 h-10 w-10 text-cork-blush/40" strokeWidth={1.5} aria-hidden />
            <p className="mb-1 text-sm font-medium text-cork-blush">No wines announced yet</p>
            <p className="text-xs text-cork-blush/60">They’ll appear here as the host pours</p>
          </div>
        ) : (
          <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-8 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:pb-0 lg:grid-cols-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {wines.map((wine) => {
              const status = wineStatus(wine, samplingId);
              return (
                <button
                  key={wine.event_wine_id}
                  type="button"
                  onClick={() => {
                    selectWine(wine.event_wine_id);
                    openDrawer();
                  }}
                  className="group h-full w-[280px] shrink-0 cursor-pointer snap-center text-left md:w-auto"
                >
                  <div
                    className={`relative flex h-full flex-col overflow-hidden rounded-3xl border bg-cork-plum-light/40 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:shadow-lg ${
                      status === "sampling"
                        ? "border-cork-coral/20 ring-1 ring-cork-coral/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {status === "sampling" ? (
                      <div className="absolute top-0 left-0 h-1 w-full bg-cork-coral" />
                    ) : null}

                    <div className="mb-5 flex items-start justify-between">
                      {statusBadge(status)}
                      <span className="text-xs font-medium text-cork-blush/60">
                        {formatEventWhen(wine.announced_at)}
                      </span>
                    </div>

                    <div className="relative mb-6 flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-cork-plum/50 p-6">
                      {wine.image_url ? (
                        <img
                          src={cloudinaryDisplayUrl(wine.image_url)}
                          alt={wine.name}
                          className={`h-full object-contain transition-transform duration-700 ease-out group-hover:scale-110 ${
                            status === "not_reviewed" ? "opacity-90" : ""
                          }`}
                        />
                      ) : (
                        <Wine className="h-12 w-12 text-cork-blush/40" strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="mt-auto">
                      <p className="mb-1.5 text-[10px] tracking-widest text-cork-blush/60 uppercase">
                        {wine.producer}
                      </p>
                      <h4 className="mb-3 truncate font-serif text-xl tracking-tight text-cork-cream">
                        {wine.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex w-fit items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs">
                          <Star
                            className="h-3.5 w-3.5 fill-cork-coral text-cork-coral"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                          <span className="font-medium text-cork-cream">{wine.average_rating.toFixed(1)}</span>
                          <span className="text-cork-blush/60">({wine.review_count})</span>
                        </div>
                        {wine.my_rating != null ? (
                          <div className="text-[10px] font-medium text-cork-coral tabular-nums">
                            {wine.my_rating.toFixed(1)}★
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="hidden h-full w-[280px] shrink-0 snap-center md:w-auto lg:block">
              <div className="flex h-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/10 p-5 text-center opacity-60">
                <Wine className="mb-3 h-10 w-10 text-cork-blush/40" strokeWidth={1.5} aria-hidden />
                <p className="mb-1 text-sm font-medium text-cork-blush">Awaiting next pour</p>
                <p className="text-xs text-cork-blush/60">Appears automatically</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <div
        role="presentation"
        className={`fixed inset-0 z-40 bg-cork-plum/60 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeDrawer}
      />

      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full flex-col border-l border-white/10 bg-cork-plum shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:w-[480px] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!drawerOpen}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-cork-plum/90 px-6 py-5 backdrop-blur-md">
          <h3 className="text-lg font-medium tracking-tight text-cork-cream">Wine details</h3>
          <button
            type="button"
            onClick={closeDrawer}
            className="-mr-2 flex items-center justify-center rounded-full bg-white/5 p-2 text-cork-blush transition-colors hover:bg-white/10 hover:text-cork-cream"
            aria-label="Close reviews"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {featuredWine ? (
            <>
              <div className="mb-8 flex gap-5 border-b border-white/10 pb-8">
                <div className="flex h-32 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-cork-plum-light/50 p-3">
                  {featuredWine.image_url ? (
                    <img
                      src={cloudinaryDisplayUrl(featuredWine.image_url)}
                      alt=""
                      className="h-full object-contain"
                    />
                  ) : (
                    <Wine className="h-8 w-8 text-cork-blush/40" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <p className="mb-1 text-[10px] tracking-widest text-cork-blush/60 uppercase">
                    {featuredWine.producer}
                  </p>
                  <h4 className="mb-3 font-serif text-xl tracking-tight text-cork-cream">{featuredWine.name}</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1">
                      <Star className="h-3.5 w-3.5 fill-cork-coral text-cork-coral" strokeWidth={1.5} aria-hidden />
                      <span className="text-sm font-medium text-cork-cream">
                        {featuredWine.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-cork-blush/60">
                      {featuredWine.review_count} Reviews
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-8 rounded-3xl border border-white/10 bg-cork-plum/50 p-5 shadow-sm md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h4 className="font-medium tracking-tight text-cork-cream">My Review</h4>
                  <span className="text-xs text-cork-blush/60">Stars are optional.</span>
                </div>

                <div className="mb-6">
                  <StarRow interactive size="lg" value={myRating} onChange={setMyRating} />
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your tasting notes (optional)..."
                  className="mb-5 h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-light text-cork-cream shadow-sm transition-all placeholder:text-cork-blush/40 focus:border-cork-coral focus:ring-1 focus:ring-cork-coral focus:outline-none"
                />

                {submitError ? <p className="mb-3 text-sm text-cork-coral">{submitError}</p> : null}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void submitReview()}
                  className="w-full rounded-full bg-cork-coral px-8 py-3 text-sm font-medium text-cork-white shadow-md shadow-cork-coral/20 transition-colors hover:bg-cork-coral-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Saving…" : featuredWine.reviewed_by_user ? "Update Review" : "Submit Review"}
                </button>
              </div>

              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-medium text-cork-cream">Latest Comments</span>
              </div>

              <div className="space-y-8">
                {reviews.length === 0 ? (
                  <p className="text-sm text-cork-blush/60">No reviews yet — be the first.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-medium text-cork-blush">
                        {initials(review.user_name)}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1.5 flex items-start justify-between">
                          <span className="text-sm font-medium text-cork-cream">{review.user_name}</span>
                          <span className="text-[11px] font-medium text-cork-blush/50">
                            {relativeTime(review.created_at)}
                          </span>
                        </div>
                        <div className="mb-3">
                          <StarRow rating={review.rating} />
                        </div>
                        {review.comment ? (
                          <p className="text-sm font-light leading-relaxed text-cork-blush">{review.comment}</p>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      </aside>

      <div
        className={`pointer-events-none fixed bottom-8 left-1/2 z-40 flex w-max max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-cork-plum-light px-5 py-3.5 text-sm font-medium text-cork-cream shadow-2xl transition-all duration-500 ${
          showToast && toastWine ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cork-coral" />
        <span className="truncate">Host announced new wine: {toastWine}</span>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4 text-cork-blush">
          Loading your ticket…
        </div>
      }
    >
      <EventTicketPageInner />
    </Suspense>
  );
}
