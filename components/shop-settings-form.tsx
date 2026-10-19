"use client";

import { useActionState, useState } from "react";
import { ImageField } from "@/components/image-field";
import { updateShop, type FormState } from "@/lib/actions";
import type { ShopSettings } from "@/lib/types";

const label = "mb-1.5 block text-xs font-bold tracking-[0.12em] text-ink-soft uppercase";

export function ShopSettingsForm({ seller }: { seller: ShopSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateShop, null);
  const [handle, setHandle] = useState(seller.handle);
  const [bannerPos, setBannerPos] = useState({ x: seller.banner_x ?? 50, y: seller.banner_y ?? 50 });
  const [logoPos, setLogoPos] = useState({ x: seller.logo_x ?? 50, y: seller.logo_y ?? 50 });

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <input type="hidden" name="banner_x" value={bannerPos.x} />
      <input type="hidden" name="banner_y" value={bannerPos.y} />
      <input type="hidden" name="logo_x" value={logoPos.x} />
      <input type="hidden" name="logo_y" value={logoPos.y} />
      <div className="space-y-7">
        <div className="panel p-5 sm:p-6">
          <h2 className="font-display text-lg font-extrabold tracking-tight">
            Your look
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            The banner runs across the top of your shop and your picture sits on
            it. Drag either photo to choose what stays in the frame, then save.
          </p>

          <div className="mt-6 space-y-6">
            <ImageField
              name="banner"
              label={seller.banner_image_id ? "Banner" : "Banner image"}
              hint="Drag the photo to reposition it. A wide shot works best."
              shape="wide"
              maxEdge={2000}
              focalX={bannerPos.x}
              focalY={bannerPos.y}
              onFocal={(x, y) => setBannerPos({ x, y })}
              currentSrc={
                seller.banner_image_id ? `/api/images/${seller.banner_image_id}` : null
              }
            />

            <div className="border-t border-line pt-6">
              <ImageField
                name="logo"
                label={seller.logo_image_id ? "Profile picture" : "Shop picture"}
                hint="Drag to centre a face or a logo. It shows as a circle."
                shape="circle"
                maxEdge={800}
                focalX={logoPos.x}
                focalY={logoPos.y}
                onFocal={(x, y) => setLogoPos({ x, y })}
                currentSrc={
                  seller.logo_image_id ? `/api/images/${seller.logo_image_id}` : null
                }
              />
            </div>
          </div>
        </div>

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
            Save changes
          </h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Payouts are set up with Stripe in the panel above this form.
          </p>

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
