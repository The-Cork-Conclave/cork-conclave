import "server-only";

export type ActiveEvent = {
  id: string;
  slug: string;
  name: string;
  description: string;
  event_date: string;
  created_by: string;
  amount_in_kobo: string;
  image_url?: string | null;
};

export async function getActiveEvent(): Promise<ActiveEvent | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!baseUrl) return null;

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/public/event/active`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) return null;

  const json = (await res.json()) as { event?: ActiveEvent };
  const event = json.event;
  if (!event?.id || !event.slug) return null;

  return event;
}

