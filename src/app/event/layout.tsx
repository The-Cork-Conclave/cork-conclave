import type { Metadata } from "next";
import { getActiveEvent } from "@/lib/event";

export async function generateMetadata(): Promise<Metadata> {
  const event = await getActiveEvent();
  return {
    title: `${event?.name ?? "Event"}`,
    description: event?.description,
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div >{children}</div>;
}