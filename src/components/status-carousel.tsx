"use client";

import { Children, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A horizontal, scroll-snapping carousel for the service-status cards, with a
 * prev/next control at each extremity below the track. The cards are passed
 * as children (server-rendered), so this client wrapper only owns the scroll.
 *
 * Fails open: with JS off or before hydration the track is a normal
 * horizontally-scrollable row, so every card is still reachable.
 */
export function StatusCarousel({
  children,
  label,
  note,
  className,
}: {
  children: React.ReactNode;
  /** Accessible name for the prev/next group, localized by the caller. */
  label: string;
  /** Optional content shown between the prev/next controls. */
  note?: React.ReactNode;
  className?: string;
}) {
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
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            data-slide
            className="flex shrink-0 basis-[86%] snap-start sm:basis-[47%] xl:basis-[calc((100%-1.5rem)/3)]"
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Controls, one at each extremity below the track, with the caption
          (if any) centered between them. */}
      <div
        role="group"
        aria-label={label}
        className="mt-5 flex items-center gap-4"
      >
        <button
          type="button"
          onClick={() => page(-1)}
          disabled={atStart}
          aria-label={`${label} — ←`}
          className={cn(arrow)}
        >
          <ArrowLeft className="size-4" aria-hidden />
        </button>
        {note ? <div className="min-w-0 flex-1">{note}</div> : <div className="flex-1" />}
        <button
          type="button"
          onClick={() => page(1)}
          disabled={atEnd}
          aria-label={`${label} — →`}
          className={cn(arrow)}
        >
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
