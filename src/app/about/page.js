import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'About | Milanković Cycles Simulation',
  description: 'About Filip van Harreveld and his connection to Milutin Milanković',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-deep-space to-midnight-blue">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link 
          href="/" 
          className="text-stardust-white hover:text-pale-gold transition-colors duration-300 flex items-center gap-2"
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
                While my expertise lies in development and design, I wanted to create something that honors his work in a way that fits my own skillset. This project is my way of bringing his ideas into a new digital space, making them more accessible and visually engaging for a modern audience.
              </p>

              <div className="mt-12 border-t border-slate-blue pt-8">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-full bg-antique-brass flex items-center justify-center text-deep-space text-2xl font-bold">
                    F
                  </div>
                  <div>
                    <h3 className="text-xl font-playfair text-stardust-white">Filip van Harreveld</h3>
                    <p className="text-sm text-stardust-white/70 mt-1">Developer & Designer</p>
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
          <Link 
            href="/" 
            className="inline-block bg-slate-blue hover:bg-slate-blue/80 text-stardust-white px-8 py-3 rounded-lg transition-colors duration-300 shadow-lg"
          >
            Explore the Visualization
          </Link>
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