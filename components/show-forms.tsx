"use client";

import { useActionState } from "react";
import { ImageField } from "@/components/image-field";
import { goLiveNow, openShowLot, saveLiveDestination, sendShowOut } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function GoLiveForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(goLiveNow, null);
  return (
    <form action={action} className="space-y-4">
      <ImageField
        name="cover"
        label="Thumbnail"
        hint="This picture is the live card. People see it before they join."
        shape="wide"
        maxEdge={1200}
      />
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      <button disabled={pending} className="btn bg-coral text-white hover:opacity-90">
        {pending ? "Going live…" : "Go live"}
      </button>
    </form>
  );
}

export function SendOutForm({ showId }: { showId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(sendShowOut, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="show_id" value={showId} />
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium">{state.ok}</p>}
      <button disabled={pending} className="btn btn-ghost">
        {pending ? "Sending…" : "Send to YouTube and Instagram"}
      </button>
    </form>
  );
}

const CLOCKS = [
  [30, "30 seconds"],
  [60, "1 minute"],
  [120, "2 minutes"],
  [300, "5 minutes"],
] as const;

export function OpenLotForm({ showId }: { showId: number }) {
  const [state, action, pending] = useActionState<FormState, FormData>(openShowLot, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="show_id" value={showId} />
      <label className="block">
        <span className={label}>What is it</span>
        <input name="title" required maxLength={80} placeholder="Jordan vest" className="field" />
      </label>
      <label className="block">
        <span className={label}>Starting bid</span>
        <input name="start_price" required inputMode="decimal" placeholder="10" className="field" />
      </label>
      <details className="text-sm">
        <summary className="tap cursor-pointer font-semibold text-ink-soft">Timer and bid step</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={label}>Countdown</span>
            <select name="seconds" className="field" defaultValue="60">
              {CLOCKS.map(([seconds, name]) => (
                <option key={seconds} value={seconds}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Bid step</span>
            <input name="increment" inputMode="decimal" defaultValue="1" className="field" />
          </label>
        </div>
      </details>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      <button disabled={pending} className="btn btn-ink w-full">
        {pending ? "Starting…" : "Start auction"}
      </button>
    </form>
  );
}

export function DestinationForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveLiveDestination, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Platform</span>
          <select name="platform" className="field" defaultValue="youtube">
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Label</span>
          <input name="label" maxLength={40} placeholder="Main channel" className="field" />
        </label>
      </div>
      <label className="block">
        <span className={label}>Server URL</span>
        <input
          name="rtmp_url"
          required
          placeholder="rtmp://a.rtmp.youtube.com/live2"
          className="field"
        />
      </label>
      <label className="block">
        <span className={label}>Stream key</span>
        <input name="stream_key" required type="password" autoComplete="off" className="field" />
      </label>
      <p className="text-xs text-ink-faint">
        Optional. The show is already live on Thrift Sharks without this. YouTube Studio and
        Instagram Live Producer each give you a server URL and a stream key. Comments on social
        are not bids. The key is encrypted and is not shown again.
      </p>
      {state?.error && <p className="text-sm text-coral">{state.error}</p>}
      {state?.ok && <p className="text-sm font-medium">{state.ok}</p>}
      <button disabled={pending} className="btn btn-ghost">
        {pending ? "Saving…" : "Save destination"}
      </button>
    </form>
  );
}
