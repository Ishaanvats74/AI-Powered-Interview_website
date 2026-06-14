import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { Navbar } from "@/components/layout/Navbar";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewAI",
  description: "AI Powered Interview Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <ThemeProvider>
            <Navbar />

            <main className="relative min-h-screen overflow-hidden">
              {/* Grid Background */}

              <div
                className="
                  absolute inset-0
                  -z-20
                  opacity-[0.04]
                  dark:opacity-[0.08]
                "
                style={{
                  backgroundImage:
                    "linear-gradient(to right,currentColor 1px,transparent 1px),linear-gradient(to bottom,currentColor 1px,transparent 1px)",
                  backgroundSize: "60px 60px",
                }}
              />

              {/* Glow */}

              <div
                className="
                  absolute
                  left-1/2
                  top-20
                  -translate-x-1/2
                  h-125
                  w-125
                  rounded-full
                  bg-indigo-500/15
                  blur-[140px]
                  -z-10
                "
              />

              {children}
            </main>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
