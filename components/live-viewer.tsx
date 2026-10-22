"use client";

import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { viewerShowToken } from "@/lib/live-actions";

export function LiveViewer({
  showId,
  active,
  children,
}: {
  showId: number;
  active: boolean;
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

  return (
    <div className="overflow-hidden rounded-2xl bg-ink">
      <div className="relative">
        <video
          ref={screenRef}
          autoPlay
          playsInline
          muted
          className={screenOn ? "aspect-video w-full bg-black object-contain" : "hidden"}
        />
        <video
          ref={cameraRef}
          autoPlay
          playsInline
          muted={muted}
          className={
            screenOn
              ? "absolute top-2 right-2 z-10 aspect-video w-[38%] max-w-36 rounded-2xl bg-ink object-cover ring-2 ring-white sm:top-3 sm:right-3 sm:w-[70%] sm:max-w-lg"
              : phase === "playing"
                ? "aspect-[3/4] w-full bg-ink object-cover sm:aspect-video"
                : "aspect-[3/4] w-full bg-ink object-cover opacity-0 sm:aspect-video"
          }
          style={{ transform: "scaleX(-1)" }}
        />
        {phase !== "playing" && (
          <p className="absolute top-3 left-3 max-w-[70%] text-xs font-semibold text-white">
            {phase === "off" ? "Camera connects when the shop is sending it." : "Waiting for the camera…"}
          </p>
        )}
        <button
          type="button"
          className={`tap absolute z-30 rounded-full bg-black/60 px-3 text-xs font-semibold text-white ${
            screenOn ? "right-3 bottom-3" : "top-3 right-3"
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
