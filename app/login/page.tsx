import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SellerLoginForm } from "@/components/seller-login-form";
import { currentBuyer } from "@/lib/buyer-account";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? params.next : "";
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "";
  const joining = dest.startsWith("/live/");

  if (await currentBuyer()) redirect(dest || "/account");
  if (await currentSeller()) redirect(dest || "/dashboard");

  return (
    <div className="wrap max-w-md py-20">
      <div className="panel p-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {joining ? "Join this live" : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {joining
            ? "Sign in, or create an account, before you enter the live."
            : "Buyer accounts and stores use the same sign in."}
        </p>
        <div className="mt-7">
          <SellerLoginForm next={dest} />
        </div>
      </div>
    </div>
  );
}
