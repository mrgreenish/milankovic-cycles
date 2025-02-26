import { Inter, Poppins, Space_Mono, Playfair_Display } from 'next/font/google';
import localFont from 'next/font/local';
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
  title: 'Milanković Cycles Simulation',
  description: 'Interactive visualization of Milanković cycles and their effects on Earth\'s climate',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${spaceMono.variable} ${inter.variable} ${switzer.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
