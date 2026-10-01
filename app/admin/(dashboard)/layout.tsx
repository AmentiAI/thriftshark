import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { SharkMark } from "@/components/logo";

export const dynamic = "force-dynamic";

const TABS = [
  ["/admin", "Dashboard"],
  ["/admin/items", "Inventory"],
  ["/admin/items/new", "Add item"],
  ["/admin/orders", "Orders"],
  ["/admin/messages", "Messages"],
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  return (
    <div className="wrap py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div className="flex items-center gap-2.5">
          <SharkMark className="h-6 w-6 text-reef-dark" />
          <h1 className="font-display text-xl font-bold">Shop admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-ink-soft underline hover:text-reef-dark">
            View storefront
          </Link>
          <form action={logout}>
            <button className="border border-line px-3 py-1.5 text-xs font-semibold tracking-wide uppercase hover:border-ink">
              Log out
            </button>
          </form>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b border-line" aria-label="Admin sections">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="-mb-px border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-ink-soft hover:border-ink hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-8">{children}</div>
    </div>
  );
}
