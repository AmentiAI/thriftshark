import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { isAdmin } from "@/lib/auth";
import { SharkMark } from "@/components/logo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff login",
  robots: { index: false },
};

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <div className="wrap max-w-sm py-24">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-reef">
        <SharkMark className="h-7 w-7" />
      </span>
      <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight">Staff login</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Shop staff only. Everything behind here edits the live storefront.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
