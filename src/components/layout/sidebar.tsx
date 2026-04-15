"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { NAV_ITEMS } from "./nav-config";
import logoMark from "@/assets/logo.svg";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  return (
    <aside className="hidden h-full min-h-0 shrink-0 self-stretch border-r bg-card md:flex md:w-56 lg:w-64 flex-col">
      <div className="flex items-center gap-2 px-5 py-3 border-b">
        <Image
          src={logoMark}
          alt=""
          width={48}
          height={48}
          className="shrink-0 object-contain"
        />
        <Logo className="mt-2" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon, external }) => {
          const active = external
            ? false
            : href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);
          const itemClass = cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          );
          if (external) {
            return (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </a>
            );
          }
          return (
            <Link key={href} href={href} className={itemClass}>
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t hover:bg-accent transition-colors">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-start gap-3"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </Button>
      </div>
    </aside>
  );
}
