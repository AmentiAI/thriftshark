"use client";

import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { viewerShowToken } from "@/lib/live-actions";

export function LiveViewer({
  showId,
  active,
  fill = false,
  children,
}: {
  showId: number;
  active: boolean;
  /** Cover the live room instead of sitting in a card. */
  fill?: boolean;
  children?: ReactNode;
}) {
  const cameraRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"idle" | "connecting" | "playing" | "off">("idle");
  const [screenOn, setScreenOn] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!active) return;
    let room: Room | null = null;
    let cancelled = false;

    (async () => {
      setPhase("connecting");
      const session = await viewerShowToken(showId);
      if (cancelled) return;
      if (!session) {
        setPhase("off");
        return;
      }
      room = new Room();
      const attach = (track: RemoteTrack, source: Track.Source) => {
        if (track.kind !== Track.Kind.Video) return;
        const video = source === Track.Source.ScreenShare ? screenRef.current : cameraRef.current;
        if (!video) return;
        track.attach(video);
        if (source === Track.Source.ScreenShare) setScreenOn(true);
        setPhase("playing");
      };
      room.on(RoomEvent.TrackSubscribed, (track, publication) => attach(track, publication.source));
      room.on(RoomEvent.TrackUnsubscribed, (_track, publication) => {
        if (publication.source === Track.Source.ScreenShare) setScreenOn(false);
      });
      try {
        await room.connect(session.url, session.token);
      } catch {
        if (!cancelled) setPhase("off");
      }
    })();

    return () => {
      cancelled = true;
      room?.disconnect();
    };
  }, [active, showId]);

  if (!active) return null;

  const cameraClass = screenOn
    ? "absolute top-16 right-3 z-10 aspect-video w-[38%] max-w-36 rounded-2xl bg-ink object-cover ring-2 ring-white"
    : fill
      ? phase === "playing"
        ? "h-full w-full object-cover"
        : "h-full w-full object-cover opacity-0"
      : phase === "playing"
        ? "aspect-[3/4] w-full bg-ink object-cover sm:aspect-video"
        : "aspect-[3/4] w-full bg-ink object-cover opacity-0 sm:aspect-video";

  return (
    <div className={fill ? "absolute inset-0 bg-ink" : "overflow-hidden rounded-2xl bg-ink"}>
      <div className={fill ? "relative h-full" : "relative"}>
        <video
          ref={screenRef}
          autoPlay
          playsInline
          muted
          className={screenOn ? (fill ? "h-full w-full bg-black object-contain" : "aspect-video w-full bg-black object-contain") : "hidden"}
        />
        <video
          ref={cameraRef}
          autoPlay
          playsInline
          muted={muted}
          className={cameraClass}
        />
        {phase !== "playing" && (
          <p className={`absolute max-w-[70%] text-xs font-semibold text-white ${fill ? "top-20 left-4" : "top-3 left-3"}`}>
            {phase === "off" ? "Camera connects when the shop is sending it." : "Waiting for the camera…"}
          </p>
        )}
        <button
          type="button"
          className={`tap absolute z-30 rounded-full bg-black/60 px-3 text-xs font-semibold text-white ${
            fill ? "top-20 right-3" : screenOn ? "right-3 bottom-3" : "top-3 right-3"
          }`}
          onClick={() => {
            setMuted((value) => !value);
            cameraRef.current?.play().catch(() => undefined);
          }}
        >
          {muted ? "Sound on" : "Mute"}
        </button>
        {children}
      </div>
    </div>
  );
}
