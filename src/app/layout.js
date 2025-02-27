import { Inter, Space_Mono, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';
import { Analytics } from "@vercel/analytics/react";
import './globals.css';

// Define our fonts
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  // Using Playfair Display as an alternative to GT Sectra
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-space-mono',
});

// Using Inter as a fallback for Switzer
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Define the switzer font
const switzer = localFont({
  src: [
    {
      path: '../font/Switzer-Variable.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-switzer',
});

export const metadata = {
  title: 'Milanković Cycles Simulation | Climate Model Visualization',
  description: 'Interactive visualization of Milutin Milanković\'s astronomical theory of climate changes, demonstrating how Earth\'s orbital variations influence long-term climate patterns.',
  keywords: ['Milanković cycles', 'orbital forcing', 'climate model', 'Milutin Milanković', 'Earth climate', 'astronomical theory', 'paleoclimatology'],
  authors: [{ name: 'Filip van Harreveld' }],
  creator: 'Filip van Harreveld',
  publisher: 'Filip van Harreveld',
  metadataBase: new URL('https://milankovic-cycles.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Milanković Cycles Simulation | Climate Model Visualization',
    description: 'Interactive visualization of Milutin Milanković\'s astronomical theory of climate changes, demonstrating how Earth\'s orbital variations influence long-term climate patterns.',
    url: 'https://milankovic-cycles.vercel.app',
    siteName: 'Milanković Cycles Simulation',
    images: [
      {
        url: '/miltin-milankovic.jpg',
        width: 1200,
        height: 630,
        alt: 'Milutin Milanković and his astronomical theory of climate changes',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Milanković Cycles Simulation',
    description: 'Interactive visualization of Milanković cycles and their effects on Earth\'s climate',
    images: ['/miltin-milankovic.jpg'],
    creator: '@yourtwitterhandle',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  category: 'Science',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${spaceMono.variable} ${inter.variable} ${switzer.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
