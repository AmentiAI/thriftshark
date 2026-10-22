"use client";

import { Room, Track, type LocalTrackPublication } from "livekit-client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hostShowToken, startLiveShow } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";
import { SelfCamera } from "@/components/self-camera";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function LiveStudio({
  showId,
  live,
  videoReady,
  hud,
  stream,
}: {
  showId: number;
  live: boolean;
  videoReady: boolean;
  hud?: ReactNode;
  stream?: ReactNode;
}) {
  const screenRef = useRef<HTMLVideoElement>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const roomRef = useRef<Room | null>(null);
  const videoPub = useRef<LocalTrackPublication | null>(null);
  const audioPub = useRef<LocalTrackPublication | null>(null);
  const [screenOn, setScreenOn] = useState(false);
  const [note, setNote] = useState<FormState>(null);

  useEffect(() => {
    if (screenOn && screenRef.current && screenStream.current) {
      screenRef.current.srcObject = screenStream.current;
    }
  }, [screenOn]);

  useEffect(() => {
    return () => {
      stopStream(screenStream.current);
      roomRef.current?.disconnect();
    };
  }, []);

  async function publish(stream: MediaStream) {
    if (!live || !videoReady) return;
    try {
      let room = roomRef.current;
      if (!room) {
        const session = await hostShowToken(showId);
        if (!session) return;
        room = new Room();
        roomRef.current = room;
        await room.connect(session.url, session.token);
      }
      const video = stream.getVideoTracks()[0];
      const audio = stream.getAudioTracks()[0];
      if (video) {
        if (videoPub.current?.track) await videoPub.current.track.replaceTrack(video);
        else {
          videoPub.current = await room.localParticipant.publishTrack(video, {
            source: Track.Source.Camera,
          });
        }
      }
      if (audio) {
        if (audioPub.current?.track) await audioPub.current.track.replaceTrack(audio);
        else {
          audioPub.current = await room.localParticipant.publishTrack(audio, {
            source: Track.Source.Microphone,
          });
        }
      }
    } catch {
      setNote({ error: "You can still see your camera. It could not be sent to other viewers yet." });
    }
  }

  async function shareScreen() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      stopStream(screenStream.current);
      screenStream.current = stream;
      const track = stream.getVideoTracks()[0];
      track?.addEventListener("ended", () => {
        if (screenRef.current) screenRef.current.srcObject = null;
        setScreenOn(false);
      });
      setScreenOn(true);
      const room = roomRef.current;
      if (room && track) {
        await room.localParticipant.publishTrack(track, { source: Track.Source.ScreenShare });
      }
    } catch {
      setNote({ error: "Screen share was cancelled." });
    }
  }

  return (
    <div className="space-y-4">
      <div className={screenOn ? "relative" : undefined}>
        {screenOn && (
          <div className="relative overflow-hidden rounded-2xl bg-ink">
            <video
              ref={screenRef}
              autoPlay
              muted
              playsInline
              className="aspect-video w-full bg-black object-contain"
            />
            {hud}
          </div>
        )}
        <SelfCamera pip={screenOn} onStream={(stream) => void publish(stream)} footer={screenOn ? null : stream}>
          {screenOn ? null : hud}
        </SelfCamera>
        {screenOn && stream}
      </div>

      <div className="flex flex-wrap gap-2">
        {!live && (
          <form action={startLiveShow} className="w-full sm:w-auto">
            <input type="hidden" name="show_id" value={showId} />
            <button className="btn w-full bg-coral text-white hover:opacity-90 sm:w-auto">Go live</button>
          </form>
        )}
        {live && (
          <span className="inline-flex items-center gap-1.5 self-center text-sm font-bold tracking-[0.14em] text-coral uppercase">
            <span className="live-dot relative inline-block h-1.5 w-1.5 rounded-full text-coral" />
            Live
          </span>
        )}
        <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={shareScreen}>
          Share screen
        </button>
      </div>

      {!videoReady && live && (
        <p className="text-sm text-ink-soft">Viewers see you once the camera connection is on. You can still run the auction.</p>
      )}
      {note?.error && <p className="text-sm text-coral">{note.error}</p>}
      {note?.ok && <p className="text-sm font-medium">{note.ok}</p>}
    </div>
  );
}
