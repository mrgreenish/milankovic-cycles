import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: new URL("https://milankovic-cycles.vercel.app"),
  title: {
    default: "Milanković Cycles — Why Ice Ages Come and Go",
    template: "%s · Milanković Cycles",
  },
  description:
    "A guided visual tour of eccentricity, obliquity, and precession—and how they redistribute northern summer sunlight.",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Milanković Cycles — Why Ice Ages Come and Go",
    description:
      "Explore the three slow orbital motions that pace Earth’s ice-age rhythm.",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${switzer.variable} ${fraunces.variable}`}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

