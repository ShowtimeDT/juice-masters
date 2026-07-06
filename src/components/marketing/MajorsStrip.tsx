import Image from "next/image";

interface Major {
  dates: string;
  name: string;
  venue: string;
  location: string;
  thisWeek?: boolean;
}

/**
 * The four majors. Presentation-only copy for the marketing grid (venue photos
 * are not yet in the asset pipeline — see note below).
 */
const MAJORS: Major[] = [
  {
    dates: "April 9–12",
    name: "The Masters",
    venue: "Augusta National Golf Club",
    location: "Augusta, Georgia",
  },
  {
    dates: "May 14–17",
    name: "PGA Championship",
    venue: "Aronimink Golf Club",
    location: "Newtown Square, PA",
  },
  {
    dates: "June 18–21",
    name: "U.S. Open",
    venue: "Shinnecock Hills Golf Club",
    location: "Southampton, New York",
    thisWeek: true,
  },
  {
    dates: "July 16–19",
    name: "The Open",
    venue: "Royal Portrush Golf Club",
    location: "Northern Ireland",
  },
];

export default function MajorsStrip() {
  return (
    <section id="majors" className="pb-[104px] pt-0">
      <div className="mx-auto max-w-[1140px] px-6 sm:px-10">
        <div className="max-w-[720px]">
          <div className="eyebrow">The season</div>
          <h2 className="mt-4 font-serif text-[clamp(34px,4.4vw,54px)] font-medium leading-[1.04] text-ink">
            All four majors, one league.
          </h2>
          <p className="mt-[18px] text-[17.5px] text-muted">
            One team of friends, four chances at glory, a single season-long
            table that settles who actually knows golf.
          </p>
        </div>

        <div className="mt-[52px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
          {MAJORS.map((m) => (
            <div
              key={m.name}
              className="group relative overflow-hidden rounded-[16px] border border-edge bg-card transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-gold/40"
            >
              {m.thisWeek && (
                <span className="absolute left-3 top-3 z-[2] flex items-center gap-1.5 rounded-full border border-sage/40 bg-bg2/70 px-[11px] py-[5px] text-[10px] uppercase tracking-[1.5px] text-sage backdrop-blur-sm">
                  <i className="h-1.5 w-1.5 rounded-full bg-sage" /> This week
                </span>
              )}
              {/* Venue photo. Only hero-course.jpg exists today; swap per-venue
                  images here when they land in /public. */}
              <div className="relative h-[134px] w-full">
                <Image
                  src="/hero-course.jpg"
                  alt={`${m.venue}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
              </div>
              <div className="px-[19px] pb-[21px] pt-[17px]">
                <div className="text-[11px] uppercase tracking-[2px] text-gold">
                  {m.dates}
                </div>
                <h3 className="mt-[7px] font-serif text-[24px] font-medium leading-[1.04] text-ink">
                  {m.name}
                </h3>
                <div className="mt-[7px] text-[13px] text-muted">{m.venue}</div>
                <div className="mt-[3px] text-[12.5px] text-faint">
                  {m.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
