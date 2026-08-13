"use client";

import { Children, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getDictionary, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A scroll-snapping carousel below `lg`, and a plain three-column grid at
 * `lg` and above. The cards are passed as children (server-rendered), so this
 * client wrapper only owns the scroll.
 *
 * **The desktop grid is not a style choice.** As a carousel at every width
 * this showed three slides at a time, which put four of the seven service
 * statuses — and half the six routes — behind a horizontal swipe on a
 * full-size screen. On a site whose job is "is there water, is the hospital
 * open", an outage a reader has to swipe to discover is an outage they do not
 * see. Where the space exists, everything is shown at once; the carousel
 * earns its place only on a phone, where it genuinely beats a six-deep stack.
 *
 * Fails open twice over: with JS off or before hydration the track is still a
 * normal horizontally-scrollable row, and the grid needs no JS at all.
 */
export function StatusCarousel({
  children,
  lang,
  label,
  note,
  className,
}: {
  children: React.ReactNode;
  lang: Lang;
  /** Accessible name for the prev/next group, localized by the caller. */
  label: string;
  /** Optional content shown between the prev/next controls. */
  note?: React.ReactNode;
  className?: string;
}) {
  const t = getDictionary(lang);
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const slides = Children.toArray(children);

  function sync() {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }

  useEffect(() => {
    sync();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function page(direction: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-slide]");
    const step = slide
      ? slide.getBoundingClientRect().width + 12 /* gap-3 */
      : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  const arrow =
    "flex size-10 items-center justify-center rounded-sm border border-border text-muted-foreground transition-colors outline-none hover:border-foreground/30 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className={className}>
      <div
        ref={track}
        onScroll={sync}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            data-slide
            className="flex shrink-0 basis-[86%] snap-start sm:basis-[47%] lg:basis-auto lg:shrink"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Below `lg`: a control at each extremity with the caption between
          them, stacked above the pair on phones where two buttons leave no
          room. At `lg` the track is a grid, so the arrows go away entirely
          and the caption stands on its own. */}
      <div className="mt-5">
        {note ? <div className="mb-4 sm:hidden lg:hidden">{note}</div> : null}
        {note ? <div className="hidden lg:block">{note}</div> : null}

        <div
          role="group"
          aria-label={label}
          className="flex items-center gap-4 lg:hidden"
        >
          <button
            type="button"
            onClick={() => page(-1)}
            disabled={atStart}
            aria-label={`${t.status.carouselPrev} — ${label}`}
            className={cn(arrow)}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            {note ? <div className="hidden sm:block">{note}</div> : null}
          </div>
          <button
            type="button"
            onClick={() => page(1)}
            disabled={atEnd}
            aria-label={`${t.status.carouselNext} — ${label}`}
            className={cn(arrow)}
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
