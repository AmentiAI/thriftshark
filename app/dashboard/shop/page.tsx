import Link from "next/link";
import { ShopSettingsForm } from "@/components/shop-settings-form";
import { requireSeller } from "@/lib/seller-auth";
import { toShopSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ShopSettingsPage() {
  const seller = await requireSeller();

  return (
    <div>
      <header className="mb-8">
        <h2 className="font-display text-3xl font-extrabold tracking-[-0.03em]">
          Your storefront
        </h2>
        <p className="mt-2 text-ink-soft">
          This is what buyers see at{" "}
          <Link href={`/shop/${seller.handle}`} className="underline hover:text-reef-dark">
            /shop/{seller.handle}
          </Link>
          .
        </p>
      </header>
      <ShopSettingsForm seller={toShopSettings(seller)} />
    </div>
  );
}
