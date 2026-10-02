import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SellerLoginForm } from "@/components/seller-login-form";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Seller sign in",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await currentSeller()) redirect("/dashboard");

  return (
    <div className="wrap max-w-md py-20">
      <div className="panel p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Seller sign in
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Manage your listings, orders and storefront.
        </p>
        <div className="mt-7">
          <SellerLoginForm />
        </div>
      </div>
    </div>
  );
}
