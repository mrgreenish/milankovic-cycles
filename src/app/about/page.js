"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { deleteCookie } from '@/lib/cookieUtils';
import { useEffect } from 'react';

// Metadata needs to be moved to a separate file in app router when using 'use client'
// We'll handle this with default values for now

export default function AboutPage() {
  const router = useRouter();

  // Function to reset the intro cookie and navigate to home
  const handleViewIntro = () => {
    deleteCookie('introShown');
    router.push('/');
  };

  // Enable scrolling for the about page
  useEffect(() => {
    // Save the original overflow style
    const originalOverflow = document.body.style.overflow;
    
    // Enable scrolling
    document.body.style.overflow = 'auto';
    
    // Restore original overflow style when component unmounts
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-deep-space to-midnight-blue overflow-y-auto">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link 
          href="/" 
          className="text-stardust-white hover:text-pale-gold transition-colors duration-300 flex items-center gap-2"
          // prefetch={false} // Only prefetch on hover for better performance
        >
          <span className="text-xl font-medium">← Home</span>
        </Link>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 pt-32 pb-24 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">
          {/* Image column */}
          <div className="relative order-2 md:order-1">
            <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg shadow-2xl">
              <Image
                src="/miltin-milankovic.jpg"
                alt="Milutin Milanković"
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-space/80 to-transparent"></div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-slate-blue/80 backdrop-blur-sm rounded-lg p-6 shadow-xl border border-muted/20">
              <p className="mono text-xs text-stardust-white/70">Serbian Mathematician • 1879-1958</p>
              <h3 className="text-xl text-stardust-white mt-1">Milutin Milanković</h3>
            </div>
          </div>

          {/* Text column */}
          <div className="order-1 md:order-2">
            <h1 className="text-5xl md:text-6xl font-playfair text-stardust-white mb-8 leading-tight">
              <span className="text-antique-brass">Inspired</span> by Milutin Milanković
            </h1>
            
            <div className="prose prose-lg prose-invert max-w-none">
              <p className="text-xl text-stardust-white/90 leading-relaxed mb-6">
                Milutin Milanković was a visionary whose work on climate cycles and planetary motion shaped our understanding of the Earth's past and future. As his great-grandson, I've always felt a connection to his legacy.
              </p>
              
              <p className="text-lg text-stardust-white/80 leading-relaxed mb-6">
                Born in Serbia, Milanković's groundbreaking theories on astronomical climate forcing have influenced generations of scientists. While my expertise lies in development and design, I wanted to create something that honors his work in a way that fits my own skillset. This project is my way of bringing his ideas into a new digital space, making them more accessible and visually engaging for a modern audience.
              </p>

              <div className="mt-12 border-t border-slate-blue pt-8">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-antique-brass flex items-center justify-center text-deep-space text-2xl font-bold">
                    F
                  </div>
                  <div>
                    <h3 className="text-xl font-playfair text-stardust-white">Filip van Harreveld</h3>
                    <p className="text-sm text-stardust-white/70 mt-1">Creative developer</p>
                    <a 
                      href="https://filipvanharreveld.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-antique-brass hover:text-antique-brass/80 text-sm mt-1 block"
                    >
                      filipvanharreveld.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional content */}
        <div className="mt-24 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-playfair text-antique-brass mb-8">About This Project</h2>
          <p className="text-lg text-stardust-white/80 leading-relaxed mb-8">
            This interactive visualization explores the Milanković cycles — the collective effects of changes in the Earth's movements on its climate over thousands of years. The visualization aims to make these complex astronomical concepts more accessible through digital design and interactive elements.
          </p>
          
          <div className="mt-8 mb-12 p-6 bg-slate-blue/20 rounded-lg border border-slate-blue/30">
            <h3 className="text-xl font-playfair text-antique-brass mb-4">Contact</h3>
            <p className="text-stardust-white/80 mb-4">
              If you notice any inaccuracies or have suggestions for improvement, please feel free to reach out.
            </p>
            <p className="text-stardust-white/90 font-mono">
              <span>contact</span>
              <span> [at] </span>
              <span>f.vanharreveld</span>
              <span>gmail</span>
              <span> [dot] </span>
              <span>com</span>
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/" 
              className="inline-block bg-slate-blue hover:bg-slate-blue/80 text-stardust-white px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg"
              prefetch={false}
            >
              Explore the Visualization
            </Link>
            <button 
              onClick={handleViewIntro}
              className="inline-block bg-antique-brass hover:bg-antique-brass/80 text-deep-space px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg"
            >
              View Intro Tutorial
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-8 bg-deep-space/80 border-t border-slate-blue/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-stardust-white/60">
            © {new Date().getFullYear()} Filip van Harreveld • Built with Next.js and Three.js
          </p>
        </div>
      </footer>
    </main>
  );
} 