import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignupForm } from "@/components/signup-form";
import { currentSeller } from "@/lib/seller-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Open your shop",
  description:
    "Open a Thrift Shark shop in about a minute. Your own storefront, your logo, paid straight to Cash App.",
};

const PERKS = [
  ["Free to open", "No listing fees, no monthly fee. List what you want, when you want."],
  ["Your storefront", "Your own page at /shop/your-name, with your logo, banner and bio."],
  ["Paid to Cash App", "Buyers scan your Cash App code and pay you directly. We never hold your money."],
  ["Live immediately", "Your shop is public the moment you sign up. No waiting on approval."],
];

export default async function SignupPage() {
  if (await currentSeller()) redirect("/dashboard");

  return (
    <div className="wrap grid gap-12 py-12 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <div className="rounded-[2rem] bg-ink p-8 text-paper sm:p-10">
        <p className="eyebrow-pill">Start selling</p>
        <h1 className="mt-5 font-display text-5xl leading-[0.9] font-extrabold tracking-[-0.05em]">
          Your shop,
          <span className="block text-reef">your money.</span>
        </h1>
        <p className="mt-5 leading-relaxed text-paper/70">
          Thrift Shark is a marketplace, not a middleman. You run the shop, set
          the prices and keep every dollar — buyers pay your Cash App directly.
        </p>

        <dl className="mt-10 space-y-6">
          {PERKS.map(([title, body], i) => (
            <div key={title} className="flex gap-4">
              <span className="font-display text-2xl leading-none font-extrabold text-reef">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <dt className="font-bold">{title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-paper/65">{body}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="panel p-7 sm:p-9">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          Open your shop
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Takes about a minute. You can add your logo and photos right after.
        </p>
        <div className="mt-7">
          <SignupForm />
        </div>
      </div>
    </div>
  );
}
