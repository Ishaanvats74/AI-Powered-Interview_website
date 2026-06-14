"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Analysis",
    href: "/analysis",
  },
  {
    label: "Interview",
    href: "/interview/setup",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}

        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          Interview
          <span className="text-indigo-500">AI</span>
        </Link>

        {/* Navigation */}

        {isSignedIn && (
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    active
                      ? "text-indigo-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Side */}

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isSignedIn ? (
            <UserButton  />
          ) : (
            <Link
              href="/sign-in"
              className="
                rounded-lg
                bg-indigo-600
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:bg-indigo-500
              "
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}