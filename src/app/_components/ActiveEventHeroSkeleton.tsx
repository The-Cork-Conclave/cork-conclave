export default function ActiveEventHeroSkeleton() {
  return (
    <div className="w-full flex flex-col md:flex-row gap-12 md:gap-4 items-center md:items-stretch justify-center 2xl:w-3/5 animate-pulse">
      <div className="event-image-card md:flex-1 xl:w-1/3 2xl:w-full 2xl:min-w-[400px]!">
        <div className="h-full w-full rounded-[inherit] bg-[rgba(208,192,226,0.12)]" />
      </div>

      <div className="event-details-card md:flex-1 xl:w-1/3 2xl:w-full">
        <div className="inline-block h-7 w-28 rounded-full bg-[rgba(208,192,226,0.12)]" />
        <div className="mt-4 h-10 w-3/4 rounded bg-[rgba(208,192,226,0.12)]" />
        <div className="mt-3 space-y-2">
          <div className="h-4 w-full rounded bg-[rgba(208,192,226,0.12)]" />
          <div className="h-4 w-11/12 rounded bg-[rgba(208,192,226,0.12)]" />
          <div className="h-4 w-10/12 rounded bg-[rgba(208,192,226,0.12)]" />
        </div>

        <div className="mt-5 space-y-2">
          <div className="h-4 w-2/3 rounded bg-[rgba(208,192,226,0.12)]" />
          <div className="h-4 w-1/2 rounded bg-[rgba(208,192,226,0.12)]" />
          <div className="h-4 w-1/3 rounded bg-[rgba(208,192,226,0.12)]" />
        </div>

        <div className="cta-row mt-6">
          <div className="h-12 w-44 rounded-full bg-[rgba(208,192,226,0.12)]" />
        </div>
      </div>
    </div>
  );
}

