import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./experience.css";

const switzer = localFont({
  src: "../../public/font/Switzer-Variable.woff2",
  variable: "--font-switzer",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Milanković Cycles — Why ice ages come and go",
    template: "%s · Milanković Cycles",
  },
  description:
    "Three slow changes in Earth’s orbit shift summer sunlight in the far north and have paced the ice ages. A 3D tour and a lab to try it yourself.",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Milanković Cycles — Why ice ages come and go",
    description:
      "Stretch the orbit, lean the axis, wobble it, and watch midsummer sunlight at 65°N change.",
    type: "website",
    url: "/",
    images: [
      {
        url: "/miltin-milankovic.jpg",
        width: 537,
        height: 776,
        alt: "Portrait of Milutin Milanković",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#070A12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${switzer.variable} ${fraunces.variable} ${mono.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
