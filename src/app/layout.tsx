import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "react-phone-number-input/style.css";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { site } from "@/lib/site";
import Header from "@/_components/Header";
import Footer from "@/_components/Footer";
import WineGlass from "@/_components/WineGlass";
import { hasPublicMerch } from "@/lib/public-merch";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const siteUrl = site.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: siteUrl,
    siteName: site.name,
    locale: site.locale,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showMerch = await hasPublicMerch();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    description: site.description,
    sameAs: [site.socials.instagram],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: site.contact.email,
        contactType: "customer service",
        areaServed: "IE",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: site.contact.city,
      addressCountry: site.contact.country,
    },
  };

  return (
    <html lang="en" className={`${manrope.variable} ${lora.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col overflow-x-hidden antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <Toaster />
        <Providers>
          <div
            className="pointer-events-none fixed top-0 left-1/2 -z-10 h-[80vw] w-[80vw] -translate-x-1/2 rounded-full bg-cork-coral opacity-[0.03] blur-[150px]"
            aria-hidden
          />
          <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
            <WineGlass />
          </div>
          <Header showMerch={showMerch} />
          <main className="grow pt-20">{children}</main>

          <Footer />
        </Providers>
      </body>
      <Analytics />
      <SpeedInsights />
    </html>
  );
}
