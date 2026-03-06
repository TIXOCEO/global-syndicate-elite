import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalHUD from "@/components/hud/GlobalHUD";
import BottomNav from "@/components/navigation/BottomNav";
import InstallModal from "@/components/pwa/InstallModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Syndicate Elite",
  description: "The World Doesn’t Run Itself.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  themeColor: "#0B1220",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Global Syndicate Elite",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // TODO: Replace with real character rank from store / API
  const characterRank = 2;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0B1220] text-white`}
      >
        <div className="flex flex-col min-h-screen">

          <GlobalHUD />

          <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-20 pb-24">
            {children}
          </main>

          <BottomNav />

          <InstallModal rank={characterRank} />

        </div>
      </body>
    </html>
  );
}
