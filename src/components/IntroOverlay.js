import React, { useRef, useState, useEffect } from "react";
import { Poppins } from "next/font/google";

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
export default function IntroOverlay({ onStart }) {
  const [isHovering, setIsHovering] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        if (distanceFromCenter < rect.width / 2) {
          setIsHovering(true);
        } else {
          setIsHovering(false);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    // Delay to allow for animation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    onStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-space">
      <ParticleEffect />
      
      <div className="relative z-10 max-w-4xl px-6 py-12 text-center">
        <h1 className="mb-6 text-5xl font-serif text-stardust-white animate-slideUp">
          Milankovitch Cycles <span className="text-antique-brass">Observatory</span>
        </h1>
        
        <p className="mb-8 text-lg text-stardust-white opacity-80 max-w-2xl mx-auto animate-fadeIn">
          Explore how Earth's orbital variations influence our climate over thousands of years. 
          This interactive simulation demonstrates the relationship between orbital mechanics and climate patterns.
        </p>
        
        <div className="mb-12 flex justify-center animate-scaleUp">
          <button
            ref={buttonRef}
            onClick={handleStart}
            disabled={isStarting}
            className={`celestial-button px-8 py-4 text-lg font-medium transition-all duration-500 ${
              isHovering ? "bg-antique-brass text-deep-space" : ""
            } ${isStarting ? "opacity-0 scale-90" : "opacity-100 scale-100"}`}
          >
            Enter Observatory
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          <div className="observatory-panel p-4">
            <h3 className="text-lg font-serif text-antique-brass mb-2">Eccentricity</h3>
            <p className="text-sm text-stardust-white opacity-80">
              The shape of Earth's orbit around the Sun, varying from nearly circular to more elliptical over a 100,000-year cycle.
            </p>
          </div>
          
          <div className="observatory-panel p-4">
            <h3 className="text-lg font-serif text-antique-brass mb-2">Axial Tilt</h3>
            <p className="text-sm text-stardust-white opacity-80">
              The angle of Earth's axis relative to its orbital plane, oscillating between 22.1° and 24.5° over a 41,000-year cycle.
            </p>
          </div>
          
          <div className="observatory-panel p-4">
            <h3 className="text-lg font-serif text-antique-brass mb-2">Precession</h3>
            <p className="text-sm text-stardust-white opacity-80">
              The wobble of Earth's axis, completing a full cycle every 26,000 years and determining which hemisphere faces the Sun at perihelion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
