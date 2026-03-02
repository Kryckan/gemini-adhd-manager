import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ShortcutProvider } from "@/components/providers/ShortcutProvider";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { QuickNoteModal } from "@/components/ui/QuickNoteModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowState - General Manager",
  description: "Extreme focus dashboard for ADHD technical leaders and managers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ShortcutProvider>
          {children}
          <CommandPalette />
          <QuickNoteModal />
        </ShortcutProvider>
      </body>
    </html>
  );
}
