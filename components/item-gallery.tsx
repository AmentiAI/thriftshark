"use client";

import Image from "next/image";
import { useState } from "react";
import { imageSrc, type ItemImage } from "@/lib/types";

export function ItemGallery({ images, title }: { images: ItemImage[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-3/4 items-center justify-center rounded-[1.8rem] bg-paper-dim text-sm text-ink-faint">
        No photos yet
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];
  const currentSrc = imageSrc(current);

  return (
    <div className="space-y-3">
      <div className="relative aspect-3/4 overflow-hidden rounded-[1.8rem] bg-white ring-1 ring-black/5">
        <Image
          src={currentSrc ?? ""}
          alt={current.alt ?? title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-8"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, i) => (
            <button
              key={imageSrc(image) ?? i}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative aspect-square overflow-hidden rounded-2xl bg-paper-dim transition ${
                i === active ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={imageSrc(image) ?? ""}
                alt=""
                fill
                sizes="120px"
                className="object-contain bg-white p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
