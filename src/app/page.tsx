import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover curated cork tastings, salons, and artisan gatherings in Cork City.",
  alternates: {
    canonical: site.url,
  },
};

export default function Home() {
  const upcomingEvent = {
    ticketLink: "hhttps://tix.africa/discover/backtotheroots", // Replace with your actual ticket link
  };

  // Preview gallery images from recent events
  const galleryPreview = [
    "IMG_0826.jpg",
    "DSC02319.jpg",
    "20251115_175804.jpg",
    "IMG_1329.JPG",
  ].map((filename) => ({
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

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-intro">
            <h1 className="hero-title">The Cork Conclave</h1>
            <p className="hero-subtitle">
             A community of young people who use wine as an excuse to build a community. Join us monthly at fun evenings curated to ensure connection, enjoyment and relaxation.
            </p>
            <div className="cta-row">
              <a
                className="button"
                href={site.socials.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Follow on Instagram
              </a>
            </div>
          </div>

          <div className="event-image-card">
            <Image
              src="/images/april.jpeg"
              alt="Back To The Roots"
              fill
              sizes="(max-width: 900px) 400px, 360px"
              style={{ objectFit: 'cover' }}
              priority
              quality={90}
            />
          </div>

          <div className="event-details-card">
            <span className="badge">Next Conclave</span>
            <h2 className="section-title">
              Back To The Roots
            </h2>
            <p className="muted">
Ransack your wardrobes, pull out your ólekús and your dànṣíkís, your agbádás and sọrọs, your ìrós and bùbá, and then come drink wine with the good people of The Cork Conclave.</p>
            <ul>
              <li>Saturday Apr 18, 4:00 PM</li>
              <li>Palms Mall, Ring Road{site.contact.city}</li>
              <li>Limited Spots Available</li>
            </ul>
            <div className="cta-row">
              <a
                className="button"
                href={upcomingEvent.ticketLink}
                target="_blank"
                rel="noreferrer"
              >
                Save Your Spot
              </a>
            </div>
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
                Evenings filled with good wine to help you shrug off the stress and relax. Over here, we’re all about the good life.
              </p>
            </div>
            <div className="card">
              <h3>Community</h3>
              <p className="muted">
               We are not a wine club. We are a community of people who love wine, and love life. 
               We come together every month to bask in our shared interests.
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
                  style={{ objectFit: 'cover' }}
                  loading={index < 2 ? 'eager' : 'lazy'}
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
                The Cork Conclave community is built on shared experiences.
                Attend one of our gatherings to connect with fellow enthusiasts,
                and become part of our inner circle.
              </p>
            </div>
            <div className="cta-row">
              <a
                className="button"
                href={site.socials.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Follow on Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
