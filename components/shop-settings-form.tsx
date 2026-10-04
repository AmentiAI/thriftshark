"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { ShopAvatar } from "@/components/shop-avatar";
import { ImageField } from "@/components/image-field";
import { updateShop, type FormState } from "@/lib/actions";
import type { ShopSettings } from "@/lib/types";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function ShopSettingsForm({ seller }: { seller: ShopSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateShop, null);
  const [handle, setHandle] = useState(seller.handle);
  const [cashtag, setCashtag] = useState(seller.cashapp_tag ?? "");

  const cleanCashtag = cashtag.replace(/^\$/, "").replace(/[^A-Za-z0-9_]/g, "");
  const cashtagChanged = cleanCashtag !== (seller.cashapp_tag ?? "");

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-7">
        {/* Logo and banner */}
        <div className="panel p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Your look
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            The banner runs across the top of your shop and your picture sits on
            every listing you post. Upload straight from your phone or your
            computer.
          </p>

          <div className="mt-6 space-y-6">
            <ImageField
              name="banner"
              label={seller.banner_image_id ? "Replace banner" : "Banner image"}
              hint="Wide shot, roughly 1600×500. Keep anything important away from the bottom left, where your picture overlaps."
              shape="wide"
              maxEdge={2000}
              currentSrc={
                seller.banner_image_id ? `/api/images/${seller.banner_image_id}` : null
              }
            />

            <div className="border-t border-line pt-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <ShopAvatar
                    shopName={seller.shop_name}
                    logoImageId={seller.logo_image_id}
                    size={72}
                  />
                </div>
                <ImageField
                  name="logo"
                  label={seller.logo_image_id ? "Replace your picture" : "Shop picture"}
                  hint="Square works best — a logo, or your own face. Shown as a circle."
                  shape="circle"
                  maxEdge={800}
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
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
            <ImageField
              name="cashapp_qr"
              label="Upload your own code"
              hint="Screenshot your Cash App QR, or leave this empty and we generate one from your $cashtag."
              shape="square"
              maxEdge={1000}
              quality={0.92}
            />
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
