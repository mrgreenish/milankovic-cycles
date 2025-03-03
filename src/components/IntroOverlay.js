import React, { useRef, useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import { ObservatoryButton } from './ObservatoryPanel';

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600"] });

/* Particle Effect Component - Optimized for performance */
function ParticleEffect() {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0); // Used to skip some operations every few frames
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Particle class
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 1.5 + 0.5;
      this.baseX = x;
      this.baseY = y;
      this.density = Math.random() * 30 + 1;
      this.distance = 0;
      this.speed = Math.random() * 0.5 + 0.1;

      // Color in purple/pink range
      const hue =
        Math.random() > 0.5
          ? Math.random() * 60 + 240 // Purple
          : Math.random() * 30 + 330; // Pink
      this.color = `hsla(${hue}, 80%, 70%, ${Math.random() * 0.5 + 0.4})`;
    }

    draw(ctx) {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
    }

    update(mouse) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 120; // Slightly reduced from 150 for performance
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const force = (maxDistance - distance) / maxDistance;
      const directionX = forceDirectionX * force * this.density;
      const directionY = forceDirectionY * force * this.density;

      if (distance < maxDistance) {
        this.x -= directionX * 0.8;
        this.y -= directionY * 0.8;
      } else {
        if (this.x !== this.baseX) {
          const dxBase = this.x - this.baseX;
          this.x -= dxBase / 10;
        }
        if (this.y !== this.baseY) {
          const dyBase = this.y - this.baseY;
          this.y -= dyBase / 10;
        }
      }
    }
  }

  // Initialize particles
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setDimensions({ width: canvas.width, height: canvas.height });

      // Reduced particle count for performance
      const numberOfParticles = Math.floor(
        (canvas.width * canvas.height) / 12000
      );
      particlesRef.current = [];
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push(new Particle(x, y));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouch = (e) => {
      e.preventDefault();
      mouseRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouch, { passive: false });
    window.addEventListener("touchstart", handleTouch, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouch);
      window.removeEventListener("touchstart", handleTouch);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Function to draw connections
    const drawConnections = (particles) => {
      // Reduced the threshold for connecting lines
      const connectionDistance = 70;

      ctx.save();
      ctx.shadowBlur = 2; // Lowered for performance
      ctx.shadowColor = "rgba(123, 0, 255, 0.2)";
      ctx.lineCap = "round";

      // Only do connection checks every 2nd frame
      if (frameRef.current % 2 === 0) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < connectionDistance) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);

              // Keep a minimal gradient effect
              const opacity =
                (connectionDistance - distance) / connectionDistance;
              const gradient = ctx.createLinearGradient(
                particles[i].x,
                particles[i].y,
                particles[j].x,
                particles[j].y
              );
              const baseColor = "rgba(123, 0, 255,";
              const accentColor = "rgba(255, 0, 123,";

              gradient.addColorStop(0, `${baseColor}${opacity * 0.4})`);
              gradient.addColorStop(1, `${accentColor}${opacity * 0.4})`);

              ctx.strokeStyle = gradient;
              ctx.lineWidth = Math.max(
                0.5,
                (connectionDistance - distance) / 50
              );
              ctx.stroke();
            }
          }
        }
      }
      ctx.restore();
    };

    const animate = () => {
      frameRef.current += 1;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw connections behind particles
      drawConnections(particlesRef.current);

      // Draw and update particles
      for (let i = 0; i < particlesRef.current.length; i++) {
        const particle = particlesRef.current[i];
        particle.update(mouseRef.current);
        particle.draw(ctx);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Disable image smoothing for performance
    ctx.imageSmoothingEnabled = false;
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}

/* IntroOverlay component with GSAP animations */
export default function IntroOverlay({ onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Check if the device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      if (onComplete) onComplete();
      if (onClose) onClose();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const steps = [
    {
      title: "Welcome to the Milanković Cycles Simulation",
      content: (
        <>
          <p className="mb-4">
            This interactive visualization demonstrates how Earth's orbital variations influence 
            its climate over long time scales – a theory proposed by Serbian scientist 
            Milutin Milanković in the early 20th century.
          </p>
          <p>
            Through this simulation, you'll be able to explore how three key orbital parameters 
            affect Earth's climate: eccentricity, obliquity (axial tilt), and precession.
          </p>
        </>
      ),
    },
    {
      title: "Orbital Parameters",
      content: (
        <>
          <p className="mb-4">
            <strong>Eccentricity:</strong> How elliptical Earth's orbit is (varies from 0 to 0.07).
            A value of 0 would be a perfect circle.
          </p>
          <p className="mb-4">
            <strong>Obliquity (Axial Tilt):</strong> The angle of Earth's rotational axis relative 
            to its orbital plane (varies from 22° to 24.5°).
          </p>
          <p>
            <strong>Precession:</strong> The direction of Earth's axis relative to the stars
            (imagine the Earth wobbling like a spinning top).
          </p>
        </>
      ),
    },
    {
      title: "How to Use This Simulation",
      content: (
        <>
          <p className="mb-4">
            {isMobile ? (
              <>
                <strong>Navigation:</strong> Use the menu button in the top right to access different scenarios 
                and information. The bottom panel provides orbital parameter controls.
              </>
            ) : (
              <>
                <strong>Controls:</strong> Use the left panels to adjust orbital parameters.
                The right panels show time controls and climate data visualizations.
              </>
            )}
          </p>
          <p className="mb-4">
            <strong>3D View:</strong> Drag to rotate the view, scroll to zoom in/out, and observe how 
            Earth's position and tilt change with different parameters.
          </p>
          <p>
            <strong>Data Visualization:</strong> Watch how changes in orbital parameters affect global 
            temperature and other climate indicators in the graphs.
          </p>
        </>
      ),
    },
    {
      title: "Ready to Explore?",
      content: (
        <p>
          You're now ready to explore the fascinating relationship between Earth's orbital 
          mechanics and climate cycles. Adjust the parameters, observe the effects, and 
          gain insight into how astronomical forces influence our planet's climate over thousands 
          of years.
        </p>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 bg-deep-space bg-opacity-95 z-50 flex items-center justify-center p-4">
      {!isMobile && <ParticleEffect />}
      <div 
        className={`relative bg-cosmic-blue rounded-xl border border-slate-blue shadow-lg shadow-purple-900/30 w-full ${
          isMobile 
            ? 'max-h-[90vh] overflow-y-auto max-w-lg' 
            : 'max-w-2xl transform transition-all duration-500 ease-out'
        }`}
      >
        <div className={`p-6 ${isMobile ? 'sm:p-6' : 'p-8'}`}>
          <h2 className="text-2xl sm:text-3xl font-serif text-stardust-white mb-2">
            {steps[step].title}
          </h2>
          
          <div className="h-1 w-full bg-slate-blue/30 mb-6 rounded-full overflow-hidden">
            <div 
              className="h-full bg-antique-brass transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="text-stardust-white space-y-2 sm:text-base text-sm mb-8">
            {steps[step].content}
          </div>
          
          <div className="flex justify-between items-center">
            <ObservatoryButton
              variant={step > 0 ? "ghost" : "ghost"}
              className={`px-4 py-2 ${step === 0 ? 'opacity-0 pointer-events-none' : ''}`}
              onClick={prevStep}
            >
              Back
            </ObservatoryButton>
            
            <ObservatoryButton
              variant="primary"
              className="px-6 py-2"
              onClick={nextStep}
            >
              {step < steps.length - 1 ? "Next" : "Get Started"}
            </ObservatoryButton>
          </div>
        </div>
      </div>
      
      {/* Skip button for mobile */}
      {isMobile && (
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stardust-white/70 hover:text-stardust-white p-2"
          aria-label="Skip intro"
        >
          Skip
        </button>
      )}
    </div>
  );
}
