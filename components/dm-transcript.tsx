import { shortWhen } from "@/lib/format";
import type { DmMessage } from "@/lib/types";

/** One conversation. The viewer's own messages sit on the right. */
export function DmTranscript({
  messages,
  viewer,
  shopName,
  buyerName,
}: {
  messages: DmMessage[];
  viewer: "buyer" | "seller" | "admin";
  shopName: string;
  buyerName: string;
}) {
  return (
    <ol className="space-y-3">
      {messages.map((message) => {
        const mine =
          viewer === "admin"
            ? message.sender === "seller"
            : message.sender === viewer;
        const who =
          message.sender === "seller" ? shopName : buyerName;
        return (
          <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 sm:max-w-lg ${
                mine ? "bg-void text-ink" : "bg-paper-dim text-ink ring-1 ring-white/10"
              }`}
            >
              <p className={`text-[11px] font-bold tracking-[0.12em] uppercase ${mine ? "text-ink/60" : "text-ink-faint"}`}>
                {who}
              </p>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{message.body}</p>
              <p className={`mt-2 text-[11px] ${mine ? "text-ink/50" : "text-ink-faint"}`}>
                {shortWhen(message.created_at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
