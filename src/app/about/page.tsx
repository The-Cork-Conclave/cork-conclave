import type { Metadata } from "next";
import Image from "next/image";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how The Cork Conclave curates immersive tastings and collaborations across Cork City.",
  alternates: {
    canonical: `${site.url}/about`,
  },
};

export default function AboutPage() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="about-hero-grid">
            <div className="about-hero-content">
              <p className="eyebrow">Our Story</p>
              <h1 className="hero-title">We Love Wine</h1>
              <p className="hero-subtitle">
                One evening, two young women asked each other - why don't we start a club to bring together all the people in Ibadan who love wine? And thus The Cork Conclave was born.
              </p>
              <p className="hero-subtitle">
                Little did they know the ripple effects of that little decision. Since its debut in November 2024, the Cork Conclave has met monthly, uniting a very diverse group of people under a singular concept: Wine!
              </p>
            </div>
            <div className="about-hero-card">
              <h2 className="section-title">Why we gather</h2>
              <p className="muted">
                We like to say that the point of Cork Conclave is an excuse to hangout with friends and drink wine. And while that is true, it is not the whole truth. The Cork Conclave has quickly become a staple of the Ibadan social community, the place to go relax and have fun after a long month of work or academics. We gather to remind ourselves that there is joy to be had in the little things, even if it is just a glass of wine.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/-a1OnlDesRY?si=mWcJywS0sgDQh5Y_"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Meet the Curators</h2>
          </div>
          <div className="grid two">
            <div className="card">
              <div className="curator-image-wrapper">
                <Image
                  src="/images/kiishi.jpeg"
                  alt="Kiishi - Cork Conclave Co-founder"
                  fill
                  sizes="(max-width: 900px) 400px, 50vw"
                  style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
                  quality={85}
                />
              </div>
              <h3>Kiishi</h3>
              <p className="muted">
                When Kiishi is not drinking wine and making her women happy, she is building products that change the world.
              </p>
            </div>
            <div className="card">
              <div className="curator-image-wrapper">
                <Image
                  src="/images/Joe.jpeg"
                  alt="Joe - Cork Conclave Co-founder"
                  fill
                  sizes="(max-width: 900px) 400px, 50vw"
                  style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
                  quality={85}
                />
              </div>
              <h3>Joe</h3>
              <p className="muted">
                Joe likes wine just as much as she likes a million other weird things, and she writes just to keep the money flowing in.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Where we meet</h2>
          </div>
          <div className="card">
            <p className="muted">
              At The Cork Conclave, we are nomads. We believe that there is so much out there to be experienced and we go searching for it. We meet in homes just as much as we meet in restaurants, art galleries, parks, theatres and a host of other public spaces.
            </p>
            <p className="muted">
              Would you like to host us? Shoot us an email at <a href="mailto:thecorkconclave@gmail.com">thecorkconclave@gmail.com</a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
