import { Inter, Space_Mono, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';
import { Analytics } from "@vercel/analytics/react";
import './globals.css';

// Set revalidation time to 6 hours (21600 seconds) for all pages
export const revalidate = 21600;

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
  title: 'Milanković Cycles Simulation | Interactive Climate Model Visualization',
  description: 'Interactive 3D visualization of Milutin Milanković\'s astronomical theory of climate changes. Explore how Earth\'s orbital variations (eccentricity, axial tilt, and precession) influence long-term climate patterns and ice ages over thousands of years.',
  keywords: [
    'Milanković cycles', 
    'Milankovitch cycles', 
    'orbital forcing', 
    'climate model', 
    'Milutin Milanković', 
    'Earth climate', 
    'astronomical theory', 
    'paleoclimatology', 
    'eccentricity', 
    'axial tilt', 
    'precession', 
    'climate change', 
    'astronomical cycles', 
    'climate simulation', 
    'ice ages', 
    'orbital variations', 
    'Earth orbit',
    'insolation',
    'climate history',
    'orbital mechanics'
  ],
  authors: [{ name: 'Filip van Harreveld' }],
  creator: 'Filip van Harreveld',
  publisher: 'Filip van Harreveld',
  metadataBase: new URL('https://milankovic-cycles.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Milanković Cycles Simulation | Interactive Climate Model Visualization',
    description: 'Interactive 3D visualization of Milutin Milanković\'s astronomical theory of climate changes. Explore how Earth\'s orbital variations influence long-term climate patterns and ice ages over thousands of years.',
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
    title: 'Milanković Cycles Simulation | Interactive Climate Model',
    description: 'Explore how Earth\'s orbital variations (eccentricity, axial tilt, and precession) influence long-term climate patterns through an interactive 3D visualization.',
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Structured data for improved SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalApplication",
            "name": "Milanković Cycles Simulation",
            "description": "Interactive 3D visualization of Milutin Milanković's astronomical theory of climate changes and how Earth's orbital variations influence long-term climate patterns.",
            "applicationCategory": "Scientific",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "Filip van Harreveld"
            },
            "about": {
              "@type": "Thing",
              "name": "Milanković cycles",
              "description": "Periodic changes in Earth's orbit that affect the amount of solar radiation received by Earth, influencing climate patterns over thousands of years.",
              "sameAs": "https://en.wikipedia.org/wiki/Milankovitch_cycles"
            },
            "educationalUse": ["Interactive Simulation", "Research", "Teaching"],
            "keywords": "Milanković cycles, orbital forcing, climate model, eccentricity, axial tilt, precession, Earth climate, paleoclimatology",
            "learningResourceType": "Simulation",
            "url": "https://milankovic-cycles.vercel.app",
            "inLanguage": "en-US"
          })
        }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
