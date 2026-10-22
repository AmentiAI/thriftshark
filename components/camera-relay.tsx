"use client";

import { useEffect, useState } from "react";
import { pullLiveSignals, pushLiveSignal } from "@/lib/live-actions";
import { HostPresence } from "@/components/host-presence";
import { SelfCamera } from "@/components/self-camera";

const STUN: RTCConfiguration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

type Signal = { id: number; viewer_key: string; kind: string; payload: string };

function parseJson<T>(payload: string): T | null {
  try {
    return JSON.parse(payload) as T;
  } catch {
    return null;
  }
}

/** Sends the host's camera straight to each viewer. Only the offer text is stored. */
export function HostRelay({
  showId,
  stream,
  enabled,
}: {
  showId: number;
  stream: MediaStream | null;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled || !stream || stream.getVideoTracks().length === 0) return;
    const media = stream;
    let cancelled = false;
    let after = 0;
    const peers = new Map<string, RTCPeerConnection>();
    const ready = new Set<string>();
    const waiting = new Map<string, RTCIceCandidateInit[]>();

    function drop(key: string) {
      peers.get(key)?.close();
      peers.delete(key);
      ready.delete(key);
      waiting.delete(key);
    }

    async function flush(key: string) {
      const pc = peers.get(key);
      const queued = waiting.get(key);
      if (!pc || !queued || !ready.has(key)) return;
      waiting.set(key, []);
      for (const init of queued) await pc.addIceCandidate(init).catch(() => undefined);
    }

    async function offerTo(key: string) {
      if (peers.has(key) || peers.size >= 20) return;
      const pc = new RTCPeerConnection(STUN);
      peers.set(key, pc);
      for (const track of media.getTracks()) pc.addTrack(track, media);
      pc.onicecandidate = (event) => {
        if (!event.candidate || cancelled) return;
        void pushLiveSignal(showId, key, "ice", true, JSON.stringify(event.candidate.toJSON()));
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed" || pc.connectionState === "closed") drop(key);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (cancelled || !pc.localDescription) return;
      await pushLiveSignal(showId, key, "offer", true, JSON.stringify(pc.localDescription));
    }

    async function tick() {
      const rows = await pullLiveSignals(showId, after, "");
      if (cancelled) return;
      for (const row of rows as Signal[]) {
        after = Math.max(after, row.id);
        if (row.kind === "join") await offerTo(row.viewer_key);
        else if (row.kind === "answer") {
          const pc = peers.get(row.viewer_key);
          const description = parseJson<RTCSessionDescriptionInit>(row.payload);
          if (!pc || description?.type !== "answer") continue;
          await pc.setRemoteDescription(description);
          ready.add(row.viewer_key);
          await flush(row.viewer_key);
        } else if (row.kind === "ice") {
          const init = parseJson<RTCIceCandidateInit>(row.payload);
          if (!init) continue;
          const queued = waiting.get(row.viewer_key) ?? [];
          queued.push(init);
          waiting.set(row.viewer_key, queued);
          await flush(row.viewer_key);
        }
      }
    }

    const timer = setInterval(() => {
      void tick().catch(() => undefined);
    }, 900);
    void tick().catch(() => undefined);

    return () => {
      cancelled = true;
      clearInterval(timer);
      for (const pc of peers.values()) pc.close();
    };
  }, [enabled, showId, stream]);

  return null;
}

/** Watches the host camera when there is no media server. Returns a stop function. */
export function startViewerRelay(
  showId: number,
  video: { current: HTMLVideoElement | null },
  onPlaying: () => void,
) {
  let cancelled = false;
  let after = 0;
  let remoteSet = false;
  let joined = false;
  let attempts = 0;
  let pc: RTCPeerConnection | null = null;
  const iceQueue: RTCIceCandidateInit[] = [];
  let key = "";

  function freshKey() {
    return `v${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`.slice(0, 40);
  }

  function closePeer() {
    pc?.close();
    pc = null;
    remoteSet = false;
    iceQueue.length = 0;
  }

  async function flush() {
    if (!pc || !remoteSet) return;
    while (iceQueue.length) {
      const init = iceQueue.shift();
      if (init) await pc.addIceCandidate(init).catch(() => undefined);
    }
  }

  function openPeer() {
    pc?.close();
    remoteSet = false;
    const next = new RTCPeerConnection(STUN);
    pc = next;
    next.ontrack = (event) => {
      const element = video.current;
      const media = event.streams[0];
      if (!element || !media) return;
      if (element.srcObject !== media) element.srcObject = media;
      void element.play().catch(() => undefined);
      onPlaying();
    };
    next.onicecandidate = (event) => {
      if (!event.candidate || cancelled) return;
      void pushLiveSignal(showId, key, "ice", false, JSON.stringify(event.candidate.toJSON()));
    };
    next.onconnectionstatechange = () => {
      if (next !== pc) return;
      if (next.connectionState === "failed") {
        closePeer();
      }
    };
  }

  async function tick() {
    attempts += 1;
    const retry = !remoteSet && attempts > 1 && attempts % 6 === 0;
    if (!joined || retry) {
      if (retry) {
        closePeer();
        key = freshKey();
      }
      joined = true;
      await pushLiveSignal(showId, key, "join", false, "");
    }
    const rows = await pullLiveSignals(showId, after, key);
    if (cancelled) return;
    for (const row of rows as Signal[]) {
      after = Math.max(after, row.id);
      if (row.kind === "offer") {
        const description = parseJson<RTCSessionDescriptionInit>(row.payload);
        if (description?.type !== "offer") continue;
        if (!pc || remoteSet) openPeer();
        if (!pc) continue;
        await pc.setRemoteDescription(description);
        remoteSet = true;
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await pushLiveSignal(showId, key, "answer", false, JSON.stringify(pc.localDescription));
        }
        await flush();
      } else if (row.kind === "ice") {
        const init = parseJson<RTCIceCandidateInit>(row.payload);
        if (!init) continue;
        iceQueue.push(init);
        await flush();
      }
    }
  }

  key = freshKey();
  const timer = setInterval(() => {
    void tick().catch(() => undefined);
  }, 900);
  void tick().catch(() => undefined);

  return () => {
    cancelled = true;
    clearInterval(timer);
    closePeer();
  };
}

/** Host camera on the public live page, sent out to viewers. */
export function HostStage({ showId }: { showId: number }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  return (
    <>
      <SelfCamera fill onStream={setStream} />
      <HostPresence showId={showId} />
      <HostRelay showId={showId} stream={stream} enabled />
    </>
  );
}
