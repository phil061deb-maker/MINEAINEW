"use client";

import { useEffect, useMemo, useState } from "react";

type Slide =
  | { type: "image"; src: string; alt?: string }
  | { type: "video"; src: string };

export default function HeroSlider() {
  const slides: Slide[] = useMemo(
    () => [
      { type: "image", src: "/hero/slide1.png", alt: "" },
      { type: "image", src: "/hero/slide2.png", alt: "" },
      { type: "video", src: "/hero/slide3.mp4" },
      { type: "video", src: "/hero/slide4.mp4" },
    ],
    []
  );

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((v) => (v + 1) % slides.length);
    }, 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  function prev() {
    setIdx((v) => (v - 1 + slides.length) % slides.length);
  }

  function next() {
    setIdx((v) => (v + 1) % slides.length);
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-amber-500/15 blur-3xl" />
        <div className="absolute -top-40 -right-48 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative">
        <div className="h-[260px] md:h-[340px] w-full">
          {slides.map((s, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-opacity duration-700 ${i === idx ? "opacity-100" : "opacity-0"}`}
            >
              {s.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt={s.alt ?? ""} className="h-full w-full object-cover" />
              ) : (
                <video
                  src={s.src}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              )}
              <div className="absolute inset-0 bg-black/35" />
            </div>
          ))}
        </div>

        <button
          onClick={prev}
          className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 border border-white/10 hover:bg-black/60 grid place-items-center"
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          onClick={next}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 border border-white/10 hover:bg-black/60 grid place-items-center"
          aria-label="Next"
        >
          ›
        </button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full border border-white/20 ${i === idx ? "bg-amber-400" : "bg-white/10"}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
