"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { ShopAvatar } from "@/components/shop-avatar";
import { updateShop, type FormState } from "@/lib/actions";
import type { ShopSettings } from "@/lib/types";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function ShopSettingsForm({ seller }: { seller: ShopSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateShop, null);
  const [handle, setHandle] = useState(seller.handle);
  const [cashtag, setCashtag] = useState(seller.cashapp_tag ?? "");
  const [logoName, setLogoName] = useState<string | null>(null);
  const [bannerName, setBannerName] = useState<string | null>(null);
  const [qrName, setQrName] = useState<string | null>(null);

  const cleanCashtag = cashtag.replace(/^\$/, "").replace(/[^A-Za-z0-9_]/g, "");
  const cashtagChanged = cleanCashtag !== (seller.cashapp_tag ?? "");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-7">
        {/* Logo and banner */}
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Logo and banner
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your logo shows on your storefront, on every listing you post and
            next to your name across the site. Square works best. Under 3MB.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5">
            <ShopAvatar
              shopName={seller.shop_name}
              logoImageId={seller.logo_image_id}
              size={88}
            />
            <div className="min-w-56 flex-1">
              <label className={label} htmlFor="logo">
                {seller.logo_image_id ? "Replace logo" : "Upload logo"}
              </label>
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setLogoName(e.target.files?.[0]?.name ?? null)}
                className="w-full rounded-2xl border border-line border-dashed bg-white px-4 py-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-wide file:text-paper file:uppercase"
              />
              {logoName && (
                <p className="mt-2 truncate text-xs font-semibold text-kelp">{logoName}</p>
              )}
            </div>
          </div>

          <div className="mt-7">
            <label className={label} htmlFor="banner">
              {seller.banner_image_id ? "Replace banner" : "Upload banner"}
            </label>
            {seller.banner_image_id && (
              <div className="relative mb-3 h-28 overflow-hidden rounded-2xl bg-paper-dim">
                <Image
                  src={`/api/images/${seller.banner_image_id}`}
                  alt="Your shop banner"
                  fill
                  sizes="600px"
                  className="object-cover"
                />
              </div>
            )}
            <input
              id="banner"
              name="banner"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setBannerName(e.target.files?.[0]?.name ?? null)}
              className="w-full rounded-2xl border border-line border-dashed bg-white px-4 py-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-wide file:text-paper file:uppercase"
            />
            {bannerName && (
              <p className="mt-2 truncate text-xs font-semibold text-kelp">{bannerName}</p>
            )}
            <p className="mt-2 text-xs text-ink-faint">
              Wide image, roughly 1600×500. Leave empty to keep what you have.
            </p>
          </div>
        </div>

        {/* Identity */}
        <div className="panel space-y-5 p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Shop details
          </h2>

          <div>
            <label className={label} htmlFor="shop_name">
              Shop name
            </label>
            <input
              id="shop_name"
              name="shop_name"
              required
              defaultValue={seller.shop_name}
              className="field"
            />
          </div>

          <div>
            <label className={label} htmlFor="handle">
              Shop link
            </label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-sm font-semibold text-ink-faint">/shop/</span>
              <input
                id="handle"
                name="handle"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                className="field"
              />
            </div>
            {handle !== seller.handle && (
              <p className="mt-1.5 text-xs text-coral">
                Changing this breaks any link you have already shared.
              </p>
            )}
          </div>

          <div>
            <label className={label} htmlFor="tagline">
              Tagline
            </label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={seller.tagline ?? ""}
              placeholder="Workwear and denim, mostly 70s"
              className="field"
            />
          </div>

          <div>
            <label className={label} htmlFor="bio">
              About your shop
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={5}
              defaultValue={seller.bio ?? ""}
              placeholder="Who you are, what you hunt for, how you ship, how fast you reply."
              className="field"
            />
          </div>

          <div>
            <label className={label} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              defaultValue={seller.location ?? ""}
              placeholder="Portland, OR"
              className="field"
            />
          </div>
        </div>
      </div>

      <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
        <div className="panel p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Getting paid
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Buyers scan this code and send you the total directly.
          </p>

          <div className="mt-5">
            <label className={label} htmlFor="cashapp_tag">
              Your $cashtag
            </label>
            <input
              id="cashapp_tag"
              name="cashapp_tag"
              required
              value={cashtag}
              onChange={(e) => setCashtag(e.target.value)}
              placeholder="$yourname"
              className="field"
            />
          </div>

          {seller.qr_image_id ? (
            <div className="mt-5 rounded-2xl bg-white p-3 ring-1 ring-black/5">
              <Image
                src={`/api/images/${seller.qr_image_id}`}
                alt={`Your Cash App code, $${seller.cashapp_tag}`}
                width={240}
                height={240}
                className="mx-auto h-40 w-40"
              />
              <p className="mt-2 text-center font-display font-extrabold">
                ${seller.cashapp_tag}
              </p>
              <p className="mt-0.5 text-center text-[11px] font-semibold text-ink-faint">
                {seller.qr_is_custom ? "Your uploaded code" : "Generated from your $cashtag"}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-paper-dim px-4 py-3 text-xs text-ink-soft">
              {cleanCashtag
                ? `Save to generate a scannable code for $${cleanCashtag}.`
                : "Add a $cashtag and we will generate your scannable code on save."}
            </p>
          )}

          {/* Either upload the screenshot from Cash App, or let us draw it. */}
          <div className="mt-5">
            <label className={label} htmlFor="cashapp_qr">
              Upload your own code
            </label>
            <input
              id="cashapp_qr"
              name="cashapp_qr"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setQrName(e.target.files?.[0]?.name ?? null)}
              className="w-full rounded-2xl border border-line border-dashed bg-white px-4 py-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-xs file:font-bold file:tracking-wide file:text-paper file:uppercase"
            />
            {qrName && (
              <p className="mt-2 truncate text-xs font-semibold text-kelp">{qrName}</p>
            )}
            <p className="mt-2 text-xs text-ink-faint">
              Screenshot your Cash App QR, or leave this empty and we generate
              one from your $cashtag.
            </p>
          </div>

          {seller.qr_image_id && (
            <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-ink-soft">
              <input
                type="checkbox"
                name="regenerate_qr"
                value="1"
                className="mt-0.5 accent-ink"
              />
              <span>
                {seller.qr_is_custom
                  ? "Replace my uploaded code with a freshly generated one"
                  : "Regenerate my code"}
                {cashtagChanged && cleanCashtag && (
                  <strong className="block text-ink"> for ${cleanCashtag}</strong>
                )}
              </span>
            </label>
          )}

          {state?.error && (
            <p className="mt-5 rounded-2xl border-l-4 border-coral bg-coral/10 px-3 py-2.5 text-sm">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="mt-5 rounded-2xl border-l-4 border-kelp bg-kelp/10 px-3 py-2.5 text-sm">
              {state.ok}
            </p>
          )}

          <button disabled={pending} className="btn btn-lime mt-5 w-full">
            {pending ? "Saving…" : "Save storefront"}
          </button>
        </div>

        <div className="panel p-6 text-sm text-ink-soft">
          <h2 className="font-display text-base font-extrabold tracking-tight text-ink">
            Your email
          </h2>
          <p className="mt-2 break-all">{seller.email}</p>
          <p className="mt-2 text-xs">
            Buyers never see this — it is only for signing in and order
            notifications.
          </p>
        </div>
      </aside>
    </form>
  );
}
