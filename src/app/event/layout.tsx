import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getActiveEvent } from "@/lib/event";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getActiveEvent();
  return {
    title: `${event?.name ?? "Event"}`,
    description: event?.description,
  };
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const event = await getActiveEvent();
  if (!event || event.is_registration_cta_closed) {
    redirect("/");
  }
  return <div>{children}</div>;
}
