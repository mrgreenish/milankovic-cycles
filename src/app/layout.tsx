import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Milanković Cycles — Why ice ages come and go",
    template: "%s · Milanković Cycles",
  },
  description:
    "Earth’s orbit and tilt change slowly. Explore how they alter summer sunlight in the far north, where cooler summers can help winter snow survive.",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Milanković Cycles — Why ice ages come and go",
    description:
      "Change Earth’s orbit, tilt, and precession to see how northern summer sunlight responds.",
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
    <html lang="en" className={`${switzer.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
