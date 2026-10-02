import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { SharkMark } from "@/components/logo";

export const dynamic = "force-dynamic";

const TABS = [
  ["/admin", "Dashboard"],
  ["/admin/sellers", "Shops"],
  ["/admin/items", "Inventory"],
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
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-reef">
            <SharkMark className="h-5 w-5" />
          </span>
          <h1 className="font-display text-xl font-extrabold tracking-tight">Shop admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold underline">
            View storefront
          </Link>
          <form action={logout}>
            <button className="btn btn-ghost !px-4 !py-2 text-xs">
              Log out
            </button>
          </form>
        </div>
      </div>

      <nav className="scroll-x flex gap-1 border-b border-line" aria-label="Admin sections">
        {TABS.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="tap -mb-px flex items-center border-b-2 border-transparent px-4 py-3 text-sm font-medium whitespace-nowrap text-ink-soft hover:border-ink hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-8">{children}</div>
    </div>
  );
}
