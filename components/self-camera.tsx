"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function capture(cameraId: string, micId: string) {
  const video = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "user" as const };
  const audio = micId ? { deviceId: { exact: micId } } : true;
  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio });
  } catch {
    return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }
}

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

/** The host's own camera. Starts immediately and lists every webcam the browser can see. */
export function SelfCamera({
  onStream,
  pip = false,
  fill = false,
  children,
  footer,
}: {
  onStream?: (stream: MediaStream) => void;
  pip?: boolean;
  /** Cover a full-screen live room. Hides the camera picker. */
  fill?: boolean;
  children?: ReactNode;
  /** Sits under the picture and above the camera picker, so a phone host sees it first. */
  footer?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onStreamRef = useRef(onStream);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState("");
  const [micId, setMicId] = useState("");
  const [error, setError] = useState<string | null>(null);

  onStreamRef.current = onStream;

  async function start(nextCamera: string, nextMic: string) {
    stopStream(streamRef.current);
    try {
      const stream = await capture(nextCamera, nextMic);
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter((device) => device.kind === "videoinput" && device.deviceId);
      const audios = devices.filter((device) => device.kind === "audioinput" && device.deviceId);
      setCameras(videos);
      setMics(audios);
      const usedCamera = stream.getVideoTracks()[0]?.getSettings().deviceId ?? nextCamera;
      const usedMic = stream.getAudioTracks()[0]?.getSettings().deviceId ?? nextMic;
      if (usedCamera) setCameraId(usedCamera);
      if (usedMic) setMicId(usedMic);
      setError(null);
      onStreamRef.current?.(stream);
    } catch {
      setError("Allow the camera and microphone in the browser, then pick a webcam.");
    }
  }

  useEffect(() => {
    void start("", "");
    return () => stopStream(streamRef.current);
    // The camera comes on once. Changing devices calls start() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={fill ? "absolute inset-0" : pip ? "contents" : "space-y-3"}>
      <div
        className={
          fill
            ? "relative h-full w-full bg-ink"
            : pip
              ? "absolute top-2 right-2 z-10 aspect-video w-[38%] max-w-36 overflow-hidden rounded-2xl bg-ink shadow-lg ring-2 ring-white sm:top-3 sm:right-3 sm:w-[70%] sm:max-w-lg"
              : "relative overflow-hidden rounded-2xl bg-ink"
        }
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={
            fill
              ? "h-full w-full object-cover"
              : pip
                ? "aspect-video w-full bg-ink object-cover"
                : "aspect-[3/4] w-full bg-ink object-cover sm:aspect-video"
          }
          style={{ transform: "scaleX(-1)" }}
        />
        {!pip && !fill && (
          <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            You
          </span>
        )}
        {!pip && !fill && children}
      </div>
      {!pip && !fill && footer}
      {!fill && <details className="rounded-2xl border border-line bg-paper px-3">
        <summary className="tap cursor-pointer text-sm font-semibold">Camera and microphone</summary>
        <div className="grid gap-3 pb-3 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Camera</span>
          <select
            className="field"
            value={cameraId}
            onChange={(event) => {
              const next = event.target.value;
              setCameraId(next);
              void start(next, micId);
            }}
          >
            {cameras.length === 0 && <option value="">Webcam</option>}
            {cameras.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Microphone</span>
          <select
            className="field"
            value={micId}
            onChange={(event) => {
              const next = event.target.value;
              setMicId(next);
              void start(cameraId, next);
            }}
          >
            {mics.length === 0 && <option value="">Microphone</option>}
            {mics.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${index + 1}`}
              </option>
            ))}
          </select>
        </label>
        </div>
      </details>}
      {error && (
        <p className={fill ? "absolute bottom-36 left-4 z-30 max-w-[70%] text-sm font-semibold text-white" : "text-sm text-coral"}>
          {error}
        </p>
      )}
    </div>
  );
}
