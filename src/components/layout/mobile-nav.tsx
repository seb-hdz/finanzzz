"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-config";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const MOBILE_TAB_ITEMS = NAV_ITEMS.filter((item) => item.mobile === "tab");
const MOBILE_MORE_ITEMS = NAV_ITEMS.filter((item) => item.mobile === "more");

function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MOBILE_MORE_ITEMS.some((item) =>
    isActivePath(pathname, item.href)
  );

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
        <div className="pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex min-h-12 items-center justify-around px-0.5">
            {MOBILE_TAB_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1.5 py-1 text-[11px] font-medium leading-none transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="size-5 shrink-0" />
                  <span className="max-w-full truncate">{label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1.5 py-1 text-[11px] font-medium leading-none transition-colors",
                moreActive ? "text-primary" : "text-muted-foreground"
              )}
              aria-expanded={moreOpen}
              aria-haspopup="dialog"
            >
              <MoreHorizontal className="size-5 shrink-0" />
              <span>Más</span>
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-xl px-0 pt-2 pb-6">
          <SheetHeader className="px-4 pb-2 text-left">
            <SheetTitle className="text-base">Más</SheetTitle>
          </SheetHeader>
          <ul className="border-t px-2 py-2">
            {MOBILE_MORE_ITEMS.map(({ href, label, icon: Icon, external }) => {
              const active = external ? false : isActivePath(pathname, href);
              const rowClass = cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              );
              return (
                <li key={href}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMoreOpen(false)}
                      className={rowClass}
                    >
                      <Icon className="size-5 shrink-0" />
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={rowClass}
                    >
                      <Icon className="size-5 shrink-0" />
                      {label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
}
