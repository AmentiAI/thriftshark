"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { imageSrc, type ItemImage } from "@/lib/types";

export function ItemGallery({ images, title }: { images: ItemImage[]; title: string }) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-paper-dim text-sm text-ink-faint">
        No photos yet
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const currentSrc = imageSrc(current);
  const count = images.length;
  const step = (by: number) => setActive((i) => (Math.min(i, count - 1) + by + count) % count);

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/5] touch-pan-y overflow-hidden rounded-xl bg-paper-dim"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
      >
        <Image
          src={currentSrc ?? ""}
          alt={current.alt ?? title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="tap absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="tap absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm">
              {Math.min(active, count - 1) + 1} / {count}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={imageSrc(image) ?? i}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-lg bg-paper-dim ${
                i === active ? "ring-2 ring-ink ring-offset-2" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={imageSrc(image) ?? ""}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
