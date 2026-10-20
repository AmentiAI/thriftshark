import { refreshStripeStatus, startStripeOnboarding } from "@/lib/actions";
import type { ShopSettings } from "@/lib/types";

export function StripeConnectPanel({
  seller,
  notice,
}: {
  seller: ShopSettings;
  notice?: string | null;
}) {
  const ready = seller.stripe_charges_enabled && seller.stripe_payouts_enabled;
  const started = Boolean(seller.stripe_account_id);

  return (
    <section className="panel mb-8 space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Get paid
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-soft">
            Connect a Stripe account so buyers can pay by card. Money goes to
            your bank through Stripe — Thrift Sharks never holds it.
          </p>
        </div>
        {ready ? (
          <span className="shrink-0 rounded-full bg-kelp/15 px-3 py-1 text-xs font-bold uppercase text-kelp">
            Payouts ready
          </span>
        ) : started ? (
          <span className="shrink-0 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold uppercase text-ink">
            Finish setup
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-paper-dim px-3 py-1 text-xs font-bold uppercase text-ink-soft">
            Not connected
          </span>
        )}
      </div>

      {notice && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            notice.toLowerCase().includes("could not") ||
            notice.toLowerCase().includes("not configured") ||
            notice.toLowerCase().includes("missing") ||
            notice.toLowerCase().includes("invalid") ||
            notice.toLowerCase().includes("error")
              ? "bg-coral/10 text-ink"
              : "bg-reef/10 text-ink"
          }`}
        >
          {notice}
        </p>
      )}

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-paper-dim px-4 py-3">
          <dt className="text-xs font-bold tracking-wider text-ink-faint uppercase">
            Card charges
          </dt>
          <dd className="mt-1 font-semibold">
            {seller.stripe_charges_enabled ? "Enabled" : "Not yet"}
          </dd>
        </div>
        <div className="rounded-2xl bg-paper-dim px-4 py-3">
          <dt className="text-xs font-bold tracking-wider text-ink-faint uppercase">
            Bank payouts
          </dt>
          <dd className="mt-1 font-semibold">
            {seller.stripe_payouts_enabled ? "Enabled" : "Not yet"}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-3">
        {!ready && (
          <form action={startStripeOnboarding}>
            <button type="submit" className="btn btn-ink">
              {started ? "Continue Stripe setup" : "Connect payouts with Stripe"}
            </button>
          </form>
        )}
        {started && (
          <form action={refreshStripeStatus}>
            <button type="submit" className="btn btn-ghost">
              Refresh status
            </button>
          </form>
        )}
      </div>

      {started && !ready && (
        <p className="text-xs leading-relaxed text-ink-faint">
          Finished on Stripe but the browser never came back? Close that tab and
          click <strong className="text-ink">Refresh status</strong> here. Use the
          same localhost port you opened this dashboard on.
        </p>
      )}
    </section>
  );
}
