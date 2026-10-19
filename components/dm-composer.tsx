"use client";

import { useActionState } from "react";
import { type FormState } from "@/lib/actions";

export function DmComposer({
  action,
  threadId,
  placeholder,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  threadId: number;
  placeholder: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <input type="hidden" name="thread_id" value={threadId} />
      <label className="sr-only" htmlFor={`dm-${threadId}`}>
        Message
      </label>
      <textarea
        id={`dm-${threadId}`}
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={placeholder}
        className="field"
      />
      {state?.error && (
        <p className="rounded-2xl border-l-4 border-coral bg-coral/10 px-4 py-3 text-sm">{state.error}</p>
      )}
      <button disabled={pending} className="btn btn-lime">
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
