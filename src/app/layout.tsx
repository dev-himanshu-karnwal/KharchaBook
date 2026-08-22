import "./globals.css";
import type { Metadata } from "next";
import { Outfit, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from "nextjs-toploader";
import { cn } from "@/lib/utils";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "KharchaBook",
  description: "Personal finance tracking for real life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen antialiased",
          outfit.variable,
          sourceSans.variable,
          ibmPlexMono.variable
        )}
      >
        <NextTopLoader color="oklch(0.45 0.08 210)" showSpinner={false} />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
