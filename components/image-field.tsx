"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif";

/**
 * Downscales and re-encodes a picked photo in the browser before it is ever
 * sent. This is what makes phone uploads work at all: a photo straight off a
 * camera is several megabytes and an iPhone shoots HEIC, and running it through
 * a canvas both shrinks it and turns it into a JPEG every browser and our
 * server agree on.
 *
 * If the browser cannot decode the file (some Androids refuse HEIC), the
 * original is sent untouched and the server decides.
 */
async function shrink(file: File, maxEdge: number, quality: number): Promise<File> {
  if (typeof createImageBitmap !== "function" || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));

    // Already small and already a web format: leave it alone.
    if (scale === 1 && file.size < 900_000 && file.type.startsWith("image/")
        && !/heic|heif/.test(file.type)) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

/** Puts the processed file back on the input so the form submits it. */
function setInputFile(input: HTMLInputElement, files: File[]) {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

const KB = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)}MB`
    : `${Math.round(bytes / 1024)}KB`;

export function ImageField({
  name,
  label,
  hint,
  shape = "square",
  maxEdge = 1600,
  quality = 0.82,
  multiple = false,
  max = 1,
  currentSrc,
  className = "",
}: {
  name: string;
  label: string;
  hint?: string;
  /** Controls the preview frame only. */
  shape?: "square" | "circle" | "wide";
  maxEdge?: number;
  quality?: number;
  multiple?: boolean;
  max?: number;
  currentSrc?: string | null;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ url: string; size: number }[]>([]);
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files ?? []).slice(0, max);
    if (picked.length === 0) {
      setPreviews([]);
      setNote(null);
      return;
    }

    setWorking(true);
    setNote(null);

    const before = picked.reduce((sum, f) => sum + f.size, 0);
    const processed = await Promise.all(picked.map((f) => shrink(f, maxEdge, quality)));
    const after = processed.reduce((sum, f) => sum + f.size, 0);

    if (inputRef.current) setInputFile(inputRef.current, processed);

    setPreviews(
      processed.map((f) => ({ url: URL.createObjectURL(f), size: f.size })),
    );
    setNote(
      after < before
        ? `${processed.length} photo${processed.length === 1 ? "" : "s"} ready — shrunk ${KB(before)} to ${KB(after)}`
        : `${processed.length} photo${processed.length === 1 ? "" : "s"} ready — ${KB(after)}`,
    );
    setWorking(false);
  }

  const frame =
    shape === "circle"
      ? "h-20 w-20 rounded-full sm:h-24 sm:w-24"
      : shape === "wide"
        ? "h-24 w-full rounded-2xl sm:h-32"
        : "h-20 w-16 rounded-xl";

  const showCurrent = previews.length === 0 && currentSrc;

  return (
    <div className={className}>
      <label
        className="mb-2 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase"
        htmlFor={inputId}
      >
        {label}
      </label>

      {(showCurrent || previews.length > 0) && (
        <div className={`mb-3 flex gap-2 ${shape === "wide" ? "flex-col" : "flex-wrap"}`}>
          {showCurrent && (
            <div className={`relative overflow-hidden bg-paper-dim ring-1 ring-black/5 ${frame}`}>
              <Image src={currentSrc} alt="" fill sizes="200px" className="object-cover" />
            </div>
          )}
          {previews.map((preview) => (
            <div
              key={preview.url}
              className={`relative overflow-hidden bg-paper-dim ring-2 ring-reef ${frame}`}
            >
              {/* A blob URL is not a Next-optimisable source. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* The visible control is the label, so the tap area is a full-width
          button on a phone instead of the browser's tiny default. */}
      <label
        htmlFor={inputId}
        className="tap flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-center text-sm font-bold text-ink transition active:scale-[0.99] hover:border-ink"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
          <path
            d="M10 14V4m0 0L6.5 7.5M10 4l3.5 3.5M3 13v2.5A1.5 1.5 0 004.5 17h11a1.5 1.5 0 001.5-1.5V13"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
        {working
          ? "Preparing…"
          : previews.length > 0
            ? "Choose different"
            : multiple
              ? "Choose photos"
              : "Choose photo"}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        onChange={onChange}
        className="sr-only"
      />

      <p className="mt-2 text-xs text-ink-faint">
        {note ? <span className="font-semibold text-kelp">{note}</span> : hint}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">
        From your phone&apos;s camera roll or your computer. iPhone HEIC is fine —
        we convert it here before upload.
      </p>
    </div>
  );
}
