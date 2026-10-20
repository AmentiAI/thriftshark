"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";

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
    if (
      scale === 1 &&
      file.size < 400_000 &&
      file.type.startsWith("image/") &&
      !/heic|heif/.test(file.type)
    ) {
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

    // Hosting platforms often reject large Server Action bodies (~4.5MB). Keep
    // each photo lean so a full set still fits.
    let q = quality;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", q),
      );
      if (!blob) break;
      if (blob.size <= 550_000 || q <= 0.5) break;
      q = Math.max(0.5, q - 0.12);
    }
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

function clampFocal(n: number) {
  return Math.round(Math.min(100, Math.max(0, n)));
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
  focalX = 50,
  focalY = 50,
  onFocal,
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
  /** Crop position, 0–100. When `onFocal` is set the preview can be dragged. */
  focalX?: number;
  focalY?: number;
  onFocal?: (x: number, y: number) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
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
    onFocal?.(50, 50);
    setNote(
      after < before
        ? `${processed.length} photo${processed.length === 1 ? "" : "s"} ready — shrunk ${KB(before)} to ${KB(after)}`
        : `${processed.length} photo${processed.length === 1 ? "" : "s"} ready — ${KB(after)}`,
    );
    setWorking(false);
  }

  const frame =
    shape === "circle"
      ? "h-28 w-28 rounded-full"
      : shape === "wide"
        ? "aspect-[5/2] w-full rounded-2xl"
        : "h-20 w-16 rounded-xl";

  const position = { objectPosition: `${focalX}% ${focalY}%` };

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!onFocal) return;
    drag.current = { x: event.clientX, y: event.clientY, fx: focalX, fy: focalY };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic event has no pointer to capture. The drag still tracks.
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !frameRef.current || !onFocal) return;
    const rect = frameRef.current.getBoundingClientRect();
    const nextX = drag.current.fx - ((event.clientX - drag.current.x) / rect.width) * 100;
    const nextY = drag.current.fy - ((event.clientY - drag.current.y) / rect.height) * 100;
    onFocal(clampFocal(nextX), clampFocal(nextY));
  }

  function onPointerUp() {
    drag.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!onFocal) return;
    const step = event.shiftKey ? 10 : 4;
    if (event.key === "ArrowLeft") onFocal(clampFocal(focalX + step), focalY);
    else if (event.key === "ArrowRight") onFocal(clampFocal(focalX - step), focalY);
    else if (event.key === "ArrowUp") onFocal(focalX, clampFocal(focalY + step));
    else if (event.key === "ArrowDown") onFocal(focalX, clampFocal(focalY - step));
    else return;
    event.preventDefault();
  }

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
            <div
              ref={frameRef}
              role={onFocal ? "group" : undefined}
              tabIndex={onFocal ? 0 : undefined}
              aria-label={onFocal ? "Drag to reposition. Arrow keys nudge it." : undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onKeyDown={onKeyDown}
              className={`relative overflow-hidden bg-paper-dim ring-1 ring-white/10 ${frame} ${
                onFocal ? "cursor-grab touch-none active:cursor-grabbing" : ""
              }`}
            >
              <Image
                src={currentSrc}
                alt=""
                fill
                sizes="(min-width: 640px) 40vw, 100vw"
                draggable={false}
                className="pointer-events-none object-cover"
                style={position}
              />
            </div>
          )}
          {previews.map((preview) => (
            <div
              key={preview.url}
              ref={frameRef}
              role={onFocal ? "group" : undefined}
              tabIndex={onFocal ? 0 : undefined}
              aria-label={onFocal ? "Drag to reposition. Arrow keys nudge it." : undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onKeyDown={onKeyDown}
              className={`relative overflow-hidden bg-paper-dim ring-2 ring-reef ${frame} ${
                onFocal ? "cursor-grab touch-none active:cursor-grabbing" : ""
              }`}
            >
              {/* A blob URL is not a Next-optimisable source. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
                style={position}
              />
            </div>
          ))}
        </div>
      )}

      {/* The visible control is the label, so the tap area is a full-width
          button on a phone instead of the browser's tiny default. */}
      <label
        htmlFor={inputId}
        className="tap flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-paper-dim px-4 py-4 text-center text-sm font-bold text-ink transition active:scale-[0.99] hover:border-ink"
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

type PhotoEntry =
  | { key: string; kind: "existing"; id: number; src: string }
  | { key: string; kind: "new"; file: File; src: string };

/**
 * The photo set for a listing. Unlike `ImageField`, picks add to the set
 * instead of replacing it — on a phone people choose one photo at a time — and
 * each photo can be removed, moved, or made the cover.
 *
 * It submits two fields: `name` carries the new files, and `${name}_order`
 * lists the final order as `e:<item_images id>` for photos already on the
 * listing and `n:<index into the files>` for new ones. The server keeps only
 * what that list names.
 */
export function PhotoSetField({
  name,
  existing = [],
  max = 10,
  maxEdge = 1800,
  quality = 0.82,
}: {
  name: string;
  existing?: { id: number; src: string }[];
  max?: number;
  maxEdge?: number;
  quality?: number;
}) {
  const pickerId = useId();
  const filesRef = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<PhotoEntry[]>(() =>
    existing.map((e) => ({ key: `e:${e.id}`, kind: "existing", id: e.id, src: e.src })),
  );
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const fresh = useMemo(
    () => entries.filter((e): e is Extract<PhotoEntry, { kind: "new" }> => e.kind === "new"),
    [entries],
  );
  const order = entries
    .map((e) => (e.kind === "existing" ? `e:${e.id}` : `n:${fresh.indexOf(e)}`))
    .join(",");

  // The named file input always mirrors the new photos, in set order.
  // React resets a form after its action runs, which would empty the file
  // input while the previews stay — so put the files back after any reset.
  useEffect(() => {
    const input = filesRef.current;
    if (!input) return;
    const sync = () => setInputFile(input, fresh.map((e) => e.file));
    sync();
    const form = input.form;
    const onReset = () => setTimeout(sync, 0);
    form?.addEventListener("reset", onReset);
    return () => form?.removeEventListener("reset", onReset);
  }, [fresh]);

  async function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const room = max - entries.length;
    const picked = Array.from(input.files ?? []);
    input.value = "";
    if (picked.length === 0) return;
    if (room <= 0) {
      setNote(`That's the limit of ${max}. Remove one to add another.`);
      return;
    }

    setWorking(true);
    setNote(null);
    const processed = await Promise.all(
      picked.slice(0, room).map((f) => shrink(f, maxEdge, quality)),
    );
    setEntries((prev) => [
      ...prev,
      ...processed.map((file, i) => ({
        key: `n:${Date.now()}:${i}:${file.name}`,
        kind: "new" as const,
        file,
        src: URL.createObjectURL(file),
      })),
    ]);
    setNote(
      picked.length > room
        ? `Added ${room}. A listing holds ${max} photos.`
        : `Added ${processed.length} photo${processed.length === 1 ? "" : "s"}.`,
    );
    setWorking(false);
  }

  function move(index: number, to: number) {
    setEntries((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [entry] = next.splice(index, 1);
      next.splice(to, 0, entry);
      return next;
    });
  }

  function remove(index: number) {
    setEntries((prev) => {
      const gone = prev[index];
      if (gone?.kind === "new") URL.revokeObjectURL(gone.src);
      return prev.filter((_, i) => i !== index);
    });
  }

  const control =
    "tap flex h-8 w-8 items-center justify-center rounded-full bg-void/80 text-ink ring-1 ring-white/15 transition hover:bg-reef hover:text-void disabled:opacity-30";

  return (
    <div>
      <input type="hidden" name={`${name}_order`} value={order} />
      <input
        ref={filesRef}
        name={name}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden
        className="sr-only"
      />

      {entries.length > 0 && (
        <ol className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {entries.map((entry, i) => (
            <li
              key={entry.key}
              className={`relative aspect-3/4 overflow-hidden rounded-xl bg-paper-dim ring-1 ${
                i === 0 ? "ring-2 ring-reef" : "ring-white/10"
              }`}
            >
              {/* Mixes blob URLs and stored images; neither needs optimising here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={entry.src} alt="" className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 rounded-full bg-reef px-2 py-0.5 text-[10px] font-bold tracking-wider text-void uppercase">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove photo ${i + 1}`}
                className={`${control} absolute top-1.5 right-1.5 hover:bg-coral hover:text-white`}
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Move photo ${i + 1} earlier`}
                  className={control}
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M12 5l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => move(i, 0)}
                    className="tap rounded-full bg-void/80 px-2 text-[10px] font-bold tracking-wider text-ink uppercase ring-1 ring-white/15 hover:bg-reef hover:text-void"
                  >
                    Cover
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === entries.length - 1}
                  aria-label={`Move photo ${i + 1} later`}
                  className={control}
                >
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                    <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <label
        htmlFor={pickerId}
        aria-disabled={entries.length >= max}
        className={`tap flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-paper-dim px-4 py-4 text-center text-sm font-bold text-ink transition active:scale-[0.99] hover:border-ink ${
          entries.length >= max ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
          <path
            d="M10 4v12M4 10h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        {working
          ? "Preparing…"
          : entries.length === 0
            ? "Add photos"
            : entries.length >= max
              ? `${max} of ${max} photos`
              : `Add more (${entries.length} of ${max})`}
      </label>
      <input
        id={pickerId}
        type="file"
        accept={ACCEPT}
        multiple
        onChange={onPick}
        disabled={entries.length >= max}
        className="sr-only"
      />

      <p className="mt-2 text-xs text-ink-faint">
        {note ? (
          <span className="font-semibold text-kelp">{note}</span>
        ) : (
          "Pick several at once or add them one at a time. The first is the cover — use the arrows to reorder."
        )}
      </p>
      <p className="mt-1 text-[11px] text-ink-faint">
        From your phone&apos;s camera roll or your computer. iPhone HEIC is fine —
        we convert it here before upload.
      </p>
    </div>
  );
}
