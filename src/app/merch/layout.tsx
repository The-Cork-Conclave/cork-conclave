import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Merch",
  description: "Order Cork Conclave anniversary shirts — pick your color and size, then checkout securely.",
  alternates: {
    canonical: `${site.url}/merch`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
