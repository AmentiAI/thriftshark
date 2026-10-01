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
      <SharkMark className="h-10 w-10 text-reef-dark" />
      <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Staff login</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Shop staff only. Everything behind here edits the live storefront.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
