import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";
import { Suspense } from "react";
import EventSkeleton from "./_components/EventSkeleton";
import type { ElementType } from "react";
import WineGlass from "./_components/WineGlass";
import Event from "./_components/Event";

export const metadata: Metadata = {
  title: "Home",
  description: "Discover curated cork tastings, salons, and artisan gatherings in Cork City.",
  alternates: {
    canonical: site.url,
  },
};

export default function Home() {
  const galleryPreview = ["IMG_0826.jpg", "DSC02319.jpg", "20251115_175804.jpg", "IMG_1329.JPG"].map((filename) => ({
    url: `/images/gallery/${filename}`,
    alt: `Cork Conclave moment`,
  }));

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: {
      "@type": "Organization",
      name: site.name,
    },
  };

  const IconifyIcon = "iconify-icon" as unknown as ElementType;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <WineGlass />

      <section className="relative z-10 grow flex items-center py-12 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-6 flex flex-col gap-7 order-1 relative z-10">
              <div className="w-12 h-0.5 rounded-full bg-linear-to-r from-[#e86a5e] to-transparent opacity-80" />

              <div className="flex flex-col gap-5">
                <div className="inline-flex items-center gap-2 text-xs font-medium tracking-widest text-[#d1b3c4] uppercase">
                  <IconifyIcon icon="solar:star-fall-linear" stroke-width="1.5" className="text-[#e86a5e] text-base" />
                  Monthly wine-led social experiences
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight text-white leading-[1.05]">
                  The Cork <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-[#f2e6ee] to-[#a37e94]">
                    Conclave
                  </span>
                </h1>

                <p className="text-lg text-[#bba1b1] leading-relaxed font-light max-w-xl">
                  A community of young people who use wine as an excuse to build a community. Join us monthly at fun
                  evenings curated to ensure connection, enjoyment and relaxation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
                <a className="button" href={site.socials.instagram} target="_blank" rel="noreferrer">
                  Follow on Instagram
                </a>
              </div>
            </div>

            <Suspense fallback={<EventSkeleton />}>
              <Event />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="eyebrow">What we curate</p>
              <h2 className="section-title">Moments worth savoring</h2>
            </div>
            <Link className="button outline" href="/about">
              Our story
            </Link>
          </div>
          <div className="grid three">
            <div className="card">
              <h3>Wine and laughter</h3>
              <p className="muted">
                Evenings filled with good wine to help you shrug off the stress and relax. Over here, we’re all about
                the good life.
              </p>
            </div>
            <div className="card">
              <h3>Community</h3>
              <p className="muted">
                We are not a wine club. We are a community of people who love wine, and love life. We come together
                every month to bask in our shared interests.
              </p>
            </div>
            <div className="card">
              <h3>A culture of sharing</h3>
              <p className="muted">
                At The Cork Conclave, everyone shows up with a bottle, to give the others a glimpse into who you are.
                And along with that, we share stories and joy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-header">
            <div>
              <p className="eyebrow">Gallery</p>
              <h2 className="section-title">A glimpse of the mood</h2>
            </div>
            <Link className="button outline" href="/gallery">
              Explore the gallery
            </Link>
          </div>
          <div className="gallery-preview-grid">
            {galleryPreview.map((image, index) => (
              <Link key={index} href="/gallery" className="gallery-preview-item">
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                  loading={index < 2 ? "eager" : "lazy"}
                  quality={85}
                />
                <div className="gallery-preview-overlay">
                  <span>View Gallery</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card contact-card">
            <div>
              <p className="eyebrow">Become part of the community</p>
              <h2 className="section-title">Join us at an event</h2>
              <p className="muted">
                The Cork Conclave community is built on shared experiences. Attend one of our gatherings to connect with
                fellow enthusiasts, and become part of our inner circle.
              </p>
            </div>
            <div className="cta-row">
              <a className="button" href={site.socials.instagram} target="_blank" rel="noreferrer">
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
