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
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const backgroundRef = useRef(null);
  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const buttonRef = useRef(null);
  const imageRef = useRef(null);
  const decorativeLeftRef = useRef(null);
  const decorativeRightRef = useRef(null);
  const particlesRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Dynamically import GSAP to avoid SSR issues
    import("gsap").then(() => {
      // Optional: Initialize GSAP-based intro animations here
    });
  }, []);

  useEffect(() => {
    // Parallax effect for background
    const handleMouseMove = (e) => {
      if (!backgroundRef.current || !contentRef.current) return;
      const x = (window.innerWidth - e.pageX) / 100;
      const y = (window.innerHeight - e.pageY) / 100;
      backgroundRef.current.style.transform = `translate(${x}px, ${y}px)`;
      contentRef.current.style.transform = `translate(${x / 2}px, ${y / 2}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleStart = async () => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);

    const { gsap } = await import("gsap");

    // Timeline for exit animation
    const tl = gsap.timeline({
      onComplete: () => {
        setIsVisible(false);
        onStart();
      },
    });

    // Fade out container backdrop
    tl.to(containerRef.current, {
      backgroundColor: "rgba(0, 0, 0, 0)",
      duration: 1,
      ease: "power2.inOut",
    });

    // Staggered exit animations
    tl.to(
      [decorativeLeftRef.current, decorativeRightRef.current],
      {
        opacity: 0,
        y: 20,
        duration: 0.4,
        ease: "power2.inOut",
      },
      "-=0.8"
    )
      .to(
        buttonRef.current,
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.4,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(
        descriptionRef.current,
        {
          opacity: 0,
          y: -30,
          duration: 0.4,
          ease: "power2.inOut",
        },
        "-=0.3"
      )
      .to(
        [titleRef.current, imageRef.current],
        {
          opacity: 0,
          scale: 1.1,
          duration: 0.6,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(
        particlesRef.current,
        {
          opacity: 0,
          duration: 0.4,
          ease: "power2.inOut",
        },
        "-=0.4"
      )
      .to(
        backgroundRef.current,
        {
          opacity: 0,
          scale: 1.2,
          duration: 0.8,
          ease: "power2.inOut",
        },
        "-=0.6"
      );

    // Speed up exit animation
    tl.timeScale(2);
  };

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className={`
        fixed inset-0 
        bg-black
        z-50
        flex items-center justify-center 
        overflow-hidden
        ${poppins.className}
        ${isAnimatingOut ? "pointer-events-none" : ""}
      `}
    >
      {/* Particle Effect */}
      <div ref={particlesRef}>
        <ParticleEffect />
      </div>

      {/* Animated background gradient */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(76, 0, 255, 0.5) 0%, rgba(0, 0, 0, 0) 70%)",
          filter: "blur(120px)",
          transform: "scale(1.5)",
        }}
      />

      {/* Main content */}
      <div
        ref={contentRef}
        className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
      >
        {/* Left column: Text content */}
        <div className="space-y-8">
          <div ref={titleRef} className="overflow-hidden">
            <h1 className="text-6xl font-bold text-white animate-slideUp">
              Milanković
              <span className="block text-8xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Cycles
              </span>
            </h1>
          </div>

          <div ref={descriptionRef} className="space-y-6 animate-fadeIn">
            <p className="text-xl text-gray-300 leading-relaxed">
              Discover how Earth's orbital dance shapes our climate through the
              groundbreaking work of Milutin Milanković, a visionary Serbian
              mathematician and astronomer.
            </p>

            <div className="flex items-center space-x-4">
              <div className="h-[1px] w-12 bg-purple-500" />
              <p className="text-gray-400">
                Explore the intricate relationship between orbital mechanics and
                climate patterns
              </p>
            </div>
          </div>

          <button
            ref={buttonRef}
            onClick={handleStart}
            className="group relative px-8 py-4 bg-white bg-opacity-5 rounded-full overflow-hidden
                       transition-all duration-500 hover:bg-opacity-10 hover:scale-105
                       hover:shadow-[0_0_40px_rgba(123,0,255,0.3)]"
          >
            <span className="relative z-10 text-white font-medium tracking-wider">
              Begin Journey
            </span>
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0
                         group-hover:opacity-20 transition-opacity duration-500"
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 animate-spin-slow"
                style={{ transform: "rotate(-45deg)", filter: "blur(20px)" }}
              />
            </div>
          </button>
        </div>

        {/* Right column: Visual content */}
        <div ref={imageRef} className="relative aspect-square">
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20
                       animate-pulse blur-3xl"
          />
          <img
            src="/miltin-milankovic.jpg"
            alt="Milutin Milanković"
            className="relative z-10 w-full h-full object-cover rounded-2xl
                       animate-scaleUp shadow-[0_0_60px_rgba(123,0,255,0.3)]"
          />
          <div
            className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20
                       rounded-2xl -z-10 blur-2xl animate-pulse"
          />
        </div>
      </div>

      {/* Decorative elements */}
      <div
        ref={decorativeLeftRef}
        className="absolute bottom-8 left-8 flex items-center space-x-4 text-sm text-gray-500"
      >
        <span className="animate-pulse">●</span>
        <span>Interactive Experience</span>
      </div>
    </div>
  );
}
