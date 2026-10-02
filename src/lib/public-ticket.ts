import { getPublicApiBaseUrl, safeFetchJson, type ApiResult } from "@/lib/api-client";

/** Force a browser-safe format on Cloudinary delivery URLs (e.g. HEIC → JPEG). */
export function cloudinaryDisplayUrl(raw: string | null | undefined): string {
  const url = (raw ?? "").trim();
  if (!url) return url;
  const marker = "/image/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return url;
  const after = url.slice(idx + marker.length);
  if (!after || /(^|\/|,)f_/.test(after)) return url;
  return `${url.slice(0, idx + marker.length)}f_jpg/${after}`;
}

export type PublicTicketEventSummary = {
  id: string;
  name: string;
  description?: string | null;
  dress_code?: string | null;
  venue_name: string;
  venue_address?: string | null;
  event_date: string;
  image_url?: string | null;
  status: string;
};

export type PublicTicketDetails = {
  id: string;
  access_code: string;
  status: string;
  holder_name: string;
  qr_image_url?: string | null;
  created_at: string;
  registration_confirmed_at?: string | null;
};

export type PublicEventTicketResponse = {
  event: PublicTicketEventSummary;
  ticket: PublicTicketDetails;
};

export type PublicEventWineListItem = {
  event_wine_id: string;
  wine_id: string;
  name: string;
  producer: string;
  color: string;
  wine_type: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
  average_rating: number;
  review_count: number;
  announced_at: string;
  reviewed_by_user: boolean;
  my_rating?: number | null;
};

export type PublicEventWinesListResponse = {
  wines: PublicEventWineListItem[];
  total_reviews: number;
  average_rating: number;
  wines_count: number;
};

export type WineReviewItem = {
  id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

export type PublicEventWineDetailResponse = {
  event_wine_id: string;
  wine_id: string;
  name: string;
  producer: string;
  color: string;
  wine_type: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
  average_rating: number;
  review_count: number;
  announced_at: string;
  reviews: WineReviewItem[];
  my_review?: WineReviewItem | null;
};

function ticketQuery(token: string) {
  return `token=${encodeURIComponent(token)}`;
}

export function fetchPublicEventTicket(
  eventId: string,
  token: string,
): Promise<ApiResult<PublicEventTicketResponse>> {
  const base = getPublicApiBaseUrl();
  return safeFetchJson<PublicEventTicketResponse>(
    `${base}/public/events/${encodeURIComponent(eventId)}/ticket?${ticketQuery(token)}`,
  );
}

export function fetchPublicEventWines(
  eventId: string,
  token: string,
): Promise<ApiResult<PublicEventWinesListResponse>> {
  const base = getPublicApiBaseUrl();
  return safeFetchJson<PublicEventWinesListResponse>(
    `${base}/public/events/${encodeURIComponent(eventId)}/wines?${ticketQuery(token)}`,
  );
}

export function fetchPublicEventWineDetail(
  eventId: string,
  eventWineId: string,
  token: string,
): Promise<ApiResult<PublicEventWineDetailResponse>> {
  const base = getPublicApiBaseUrl();
  return safeFetchJson<PublicEventWineDetailResponse>(
    `${base}/public/events/${encodeURIComponent(eventId)}/wines/${encodeURIComponent(eventWineId)}?${ticketQuery(token)}`,
  );
}

export function upsertPublicWineReview(
  eventId: string,
  eventWineId: string,
  token: string,
  body: { rating: number; comment?: string | null },
): Promise<ApiResult<{ review: WineReviewItem }>> {
  const base = getPublicApiBaseUrl();
  return safeFetchJson<{ review: WineReviewItem }>(
    `${base}/public/events/${encodeURIComponent(eventId)}/wines/${encodeURIComponent(eventWineId)}/review?${ticketQuery(token)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export type WineAddedSSEPayload = {
  event_wine_id: string;
  wine_id?: string;
  name?: string;
  producer?: string;
  wine_type?: string;
  color?: string;
  year?: number | null;
  country?: string | null;
  region?: string | null;
  grape_variety?: string | null;
  alcohol_level?: number | null;
  image_url?: string | null;
  announced_at?: string;
};

export type WineReviewedSSEPayload = {
  event_wine_id: string;
  review_id?: string;
  user_id?: string;
  user_name?: string;
  rating?: number;
  comment?: string | null;
  average_rating?: number;
  review_count?: number;
  wine_name?: string;
};

export type PublicEventStreamHandlers = {
  onWineAdded?: (payload: WineAddedSSEPayload) => void;
  onWineUpdated?: (payload: WineAddedSSEPayload) => void;
  onWineReviewed?: (payload: WineReviewedSSEPayload) => void;
};

/** Forward-only SSE; caller loads historical state via HTTP. */
export function subscribePublicEventStream(
  eventId: string,
  token: string,
  handlers: PublicEventStreamHandlers,
): () => void {
  const base = getPublicApiBaseUrl();
  const url = `${base}/public/events/${encodeURIComponent(eventId)}/stream?${ticketQuery(token)}`;
  const es = new EventSource(url);

  const parse = <T,>(raw: string): T | null => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  };

  es.addEventListener("wine_added", (ev) => {
    const data = parse<WineAddedSSEPayload>((ev as MessageEvent).data);
    if (data) handlers.onWineAdded?.(data);
  });
  es.addEventListener("wine_updated", (ev) => {
    const data = parse<WineAddedSSEPayload>((ev as MessageEvent).data);
    if (data) handlers.onWineUpdated?.(data);
  });
  es.addEventListener("wine_reviewed", (ev) => {
    const data = parse<WineReviewedSSEPayload>((ev as MessageEvent).data);
    if (data) handlers.onWineReviewed?.(data);
  });

  return () => {
    es.close();
  };
}
