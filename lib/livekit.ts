import "server-only";
import { AccessToken, EgressClient, StreamOutput, StreamProtocol } from "livekit-server-sdk";

export function livekitConfigured() {
  return Boolean(
    process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
  );
}

export function showRoom(showId: number) {
  return `show-${showId}`;
}

export function hostIdentity(sellerId: number) {
  return `shop-${sellerId}`;
}

function httpHost() {
  return process.env.LIVEKIT_URL!.replace(/^ws/i, "http");
}

/** A join token. Publish is only for the shop that owns the show. */
export async function mintShowToken(identity: string, showId: number, publish: boolean) {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity,
    ttl: "2h",
  });
  token.addGrant({
    roomJoin: true,
    room: showRoom(showId),
    canPublish: publish,
    canSubscribe: true,
    canPublishData: false,
  });
  return { url: process.env.LIVEKIT_URL!, token: await token.toJwt() };
}

function egressClient() {
  return new EgressClient(httpHost(), process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
}

/** Push one shop's camera to a single RTMP endpoint. Failures stay on that output. */
export async function startCameraEgress(showId: number, identity: string, rtmpUrl: string) {
  const info = await egressClient().startParticipantEgress(
    showRoom(showId),
    identity,
    {
      stream: new StreamOutput({
        protocol: StreamProtocol.RTMP,
        urls: [rtmpUrl],
      }),
    },
    { screenShare: false },
  );
  return info.egressId;
}

export async function stopCameraEgress(egressId: string) {
  await egressClient().stopEgress(egressId);
}
