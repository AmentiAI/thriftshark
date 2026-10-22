"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { postShowMessage } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";

/** One line under the stream. Enter or Send posts it, like a live chat. */
export function LiveCommentBar({
  showId,
  loginHref,
  overlay = false,
}: {
  showId: number | null;
  loginHref: string;
  /** Sits on the video, like a TikTok comment line. */
  overlay?: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(postShowMessage, null);

  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [state, router]);

  if (!showId) {
    return (
      <Link href={loginHref} className="field flex items-center text-ink-faint">
        Sign in to comment
      </Link>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className={overlay ? "relative flex min-w-0 flex-1 items-center gap-2" : "flex flex-wrap items-center gap-2"}
    >
      <input type="hidden" name="show_id" value={showId} />
      <div className="min-w-0 flex-1">
        <input
          name="body"
          required
          maxLength={280}
          enterKeyHint="send"
          autoComplete="off"
          className={
            overlay
              ? "h-11 w-full rounded-full border border-white/25 bg-white/15 px-4 text-base text-white outline-none placeholder:text-white/60"
              : "field"
          }
          placeholder={overlay ? "Say something" : "Add a comment"}
          aria-label="Add a comment"
        />
      </div>
      <button
        disabled={pending}
        className={overlay ? "btn shrink-0 bg-white/20 text-white hover:bg-white/30" : "btn btn-ink shrink-0"}
        aria-label="Send comment"
      >
        {pending ? "…" : "Send"}
      </button>
      {state?.error && (
        <p className={overlay ? "absolute -top-6 left-1 text-xs text-coral" : "basis-full text-sm text-coral"}>
          {state.error}
        </p>
      )}
    </form>
  );
}
