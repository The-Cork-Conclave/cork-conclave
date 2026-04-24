import { MoveRight } from "lucide-react";
import Image from "next/image";

export default function NoEvent() {
  return (
    <div className="lg:col-span-6 relative order-2 w-full mt-4 lg:mt-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] rounded-full bg-linear-to-br from-[#e86a5e]/5 to-[#4a1c36]/10 blur-[80px] pointer-events-none z-0" />

      <div className="group relative w-full rounded-4xl border border-white/8 bg-[#11070e] overflow-hidden ring-1 ring-white/5 ring-inset shadow-2xl transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-20px_rgba(232,106,94,0.08)] hover:ring-white/10 z-10 flex flex-col min-h-120 sm:min-h-130">
        <div className="absolute inset-0 w-full h-full bg-linear-to-br from-[#4a1c36]/30 via-[#23101c]/80 to-[#11070e] z-0" />

        <Image
          src=""
          alt="Vineyard Overlay"
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-[0.12] mix-blend-overlay blur-md grayscale"
        />

        <div
          className="absolute inset-0 opacity-[0.12] mix-blend-overlay z-0 pointer-events-none"
          style={{
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg viewBox=%5C%270%200%20200%20200%5C%27 xmlns=%5C%27http://www.w3.org/2000/svg%5C%27%3E%3Cfilter id=%5C%27noiseFilter%5C%27%3E%3CfeTurbulence type=%5C%27fractalNoise%5C%27 baseFrequency=%5C%270.85%5C%27 numOctaves=%5C%273%5C%27 stitchTiles=%5C%27stitch%5C%27/%3E%3C/filter%3E%3Crect width=%5C%27100%2525%5C%27 height=%5C%27100%2525%5C%27 filter=%5C%27url(%2523noiseFilter)%5C%27/%3E%3C/svg%3E')",
          }}
        />

        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-end">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-[120%] h-[120%] opacity-[0.05] text-[#f2e6ee] translate-x-1/4 translate-y-1/4 -rotate-6 transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-3 group-hover:opacity-[0.07]"
          >
            <path
              d="M12 15C8.68629 15 6 12.3137 6 9V3H18V9C18 12.3137 15.3137 15 12 15Z"
              strokeWidth="0.3"
              strokeLinejoin="round"
            />
            <path d="M12 15V22" strokeWidth="0.3" strokeLinecap="round" />
            <path d="M8 22H16" strokeWidth="0.3" strokeLinecap="round" />
            <path d="M6 9H18" strokeWidth="0.3" strokeLinecap="round" strokeDasharray="0.5 1" />
            <path d="M12 3V6" strokeWidth="0.3" strokeLinecap="round" />
          </svg>
        </div>

        <div className="absolute inset-0 bg-linear-to-b from-[#11070e]/20 via-[#11070e]/60 to-[#11070e]/95 z-0 pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full justify-end grow">
          <div className="mb-auto pb-24">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#11070e]/60 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium tracking-widest uppercase shadow-xl ring-1 ring-white/5 group-hover:bg-[#11070e]/80 transition-colors">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-75 duration-1000"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white/60"></span>
                </span>
                Next Conclave
              </div>

              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#a37e94]/10 border border-[#a37e94]/20 text-[#d1b3c4] text-[10px] sm:text-xs font-medium tracking-widest uppercase shadow-sm backdrop-blur-md">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 mt-auto">
            <div className="flex flex-col gap-3">
              <h2 className="text-4xl sm:text-5xl font-medium tracking-tight text-white/90 leading-[1.05] drop-shadow-lg transition-colors group-hover:text-white">
                No Conclave Announced Yet
              </h2>
              <p className="text-sm sm:text-base text-[#bba1b1]/80 leading-relaxed font-light drop-shadow max-w-sm">
                Our next gathering is being carefully curated. Follow us on instagram and be the first to know when
                registration opens.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-5 border-t border-white/5">
              <a
                href="/gallery"
                className="group/link inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3.5 text-sm font-normal text-[#bba1b1] hover:text-white transition-colors"
              >
                Explore Past Conclaves
                <MoveRight />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
