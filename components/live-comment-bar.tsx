"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { postLotComment } from "@/lib/live-actions";
import type { FormState } from "@/lib/actions";

/** One line under the stream. Enter or Send posts it, like a live chat. */
export function LiveCommentBar({
  auctionId,
  loginHref,
}: {
  auctionId: number | null;
  loginHref: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(postLotComment, null);

  useEffect(() => {
    if (!state?.ok) return;
    formRef.current?.reset();
    router.refresh();
  }, [state, router]);

  if (!auctionId) {
    return (
      <Link href={loginHref} className="field flex items-center text-ink-faint">
        Sign in to comment
      </Link>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="auction_id" value={auctionId} />
      <div className="min-w-0 flex-1">
        <input
          name="body"
          required
          maxLength={280}
          enterKeyHint="send"
          autoComplete="off"
          className="field"
          placeholder="Add a comment"
          aria-label="Add a comment"
        />
      </div>
      <button disabled={pending} className="btn btn-ink shrink-0" aria-label="Send comment">
        {pending ? "…" : "Send"}
      </button>
      {state?.error && <p className="basis-full text-sm text-coral">{state.error}</p>}
    </form>
  );
}
