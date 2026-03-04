import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Global Syndicate Elite",
  description: "The World Doesn’t Run Itself.",

  manifest: "/gse/manifest.json",

  icons: {
    icon: "/gse/icons/icon-192.png",
    apple: "/gse/icons/icon-192.png",
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0B1220] text-white`}
      >
        {children}
      </body>
    </html>
  );
}
