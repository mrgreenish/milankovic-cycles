import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { cn } from '@/lib/utils';

/**
 * ObservatoryPanel - A styled container component for the Celestial Observatory design
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {string} props.title - Panel title
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.variant - Panel variant (default, control, data, info)
 * @param {boolean} props.glowing - Whether the panel should have a glow effect
 * @param {React.ReactNode} props.icon - Optional icon to display next to the title
 * @param {boolean} props.collapsible - Whether the panel can be collapsed
 * @param {boolean} props.initialCollapsed - Whether the panel starts collapsed
 */
export function ObservatoryPanel({
  children,
  title,
  className,
  variant = 'default',
  glowing = false,
  icon,
  collapsible = false,
  initialCollapsed = false,
  ...props
}) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const contentRef = useRef(null);

  // Define variant-specific classes
  const variantClasses = {
    default: 'observatory-panel',
    control: 'control-panel',
    data: 'observatory-panel bg-opacity-50 border-aged-copper',
    info: 'observatory-panel bg-opacity-40 border-slate-blue',
    mobile: 'observatory-panel mobile-panel bg-opacity-90 backdrop-blur-sm',
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        variantClasses[variant] || variantClasses.default,
        glowing && 'animate-glow',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-opacity-20 border-slate-blue">
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <h3 className="text-lg font-serif text-stardust-white">{title}</h3>
          </div>
          {collapsible && (
            <button
              onClick={toggleCollapse}
              className="text-stardust-white opacity-70 hover:opacity-100 p-2 -mr-2 focus:outline-none focus:ring-1 focus:ring-aged-copper rounded-sm transition-opacity"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {isCollapsed ? '+' : '−'}
            </button>
          )}
        </div>
      )}
      <div 
        ref={contentRef}
        className={cn(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "max-h-0 p-0" : "p-4"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * ObservatoryButton - A styled button component for the Celestial Observatory design
 */
export function ObservatoryButton({
  children,
  className,
  variant = 'default',
  glowing = false,
  icon,
  ...props
}) {
  // Define variant-specific classes
  const variantClasses = {
    default: 'celestial-button',
    primary: 'celestial-button bg-antique-brass text-deep-space hover:bg-pale-gold',
    secondary: 'celestial-button bg-slate-blue hover:bg-opacity-90',
    ghost: 'celestial-button bg-transparent border-transparent hover:bg-deep-space hover:bg-opacity-50',
    mobile: 'celestial-button min-h-[44px] px-4 py-2',
  };

  return (
    <button
      className={cn(
        variantClasses[variant] || variantClasses.default,
        glowing && 'animate-glow',
        'flex items-center justify-center',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}

/**
 * ObservatorySlider - A styled slider component for the Celestial Observatory design
 */
export function ObservatorySlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  valueDisplay,
  ...props
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm text-stardust-white">{label}</label>
        {valueDisplay ? (
          valueDisplay
        ) : (
          <span className="text-sm font-mono text-pale-gold">{value}</span>
        )}
      </div>
      <input
        type="range"
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        step={step}
        className="celestial-slider"
        {...props}
      />
    </div>
  );
}

/**
 * DataDisplay - A component for displaying data values in the Celestial Observatory design.
 * Here we add smoothing, threshold checks, and GSAP-based animation to avoid sudden jumps.
 */
export function DataDisplay({
  label,
  value,
  unit,
  className,
  ...props
}) {
  // Store the displayedValue separately for animation/smoothing
  const [displayedValue, setDisplayedValue] = useState(value);

  // We'll use a ref to keep track of the raw numerical value we're animating
  const animationRef = useRef({ val: parseFloat(value) || 0 });

  // Threshold - if the difference is tiny, ignore the update
  const THRESHOLD = 0.05;

  // When "value" changes, animate to the new value using GSAP.
  // Smoothing can be handled by adjusting the duration or using smaller increments.
  useEffect(() => {
    const newVal = parseFloat(value) || 0;
    const oldVal = animationRef.current.val;

    // Only animate if difference exceeds a small threshold
    if (Math.abs(newVal - oldVal) > THRESHOLD) {
      gsap.to(animationRef.current, {
        val: newVal,
        duration: 0.5,
        onUpdate: () => {
          // Round to 2 decimals or adapt as needed
          setDisplayedValue(animationRef.current.val.toFixed(2));
        },
        ease: 'power1.out',
      });
    }
  }, [value]);

  return (
    <div className={cn('data-display', className)} {...props}>
      <div className="text-xs text-stardust-white opacity-80">{label}</div>
      <div className="flex items-baseline">
        <span className="text-lg font-mono text-pale-gold">
          {displayedValue}
        </span>
        {unit && (
          <span className="ml-1 text-xs text-stardust-white opacity-70">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ObservatoryTooltip - A tooltip component for the Celestial Observatory design
 */
export function ObservatoryTooltip({
  children,
  content,
  className,
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleMouseEnter = (e) => {
    if (isMobile) return;
    setIsVisible(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (isMobile) return;
    if (isVisible) {
      updatePosition(e);
    }
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsVisible(false);
  };

  const handleTouchStart = () => {
    if (!isMobile) return;
    setIsVisible(!isVisible);
  };

  const updatePosition = (e) => {
    if (tooltipRef.current) {
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;

      // Different positioning for mobile vs desktop
      if (isMobile) {
        setPosition({
          x: Math.min(Math.max(10, window.innerWidth / 2 - tooltipWidth / 2), window.innerWidth - tooltipWidth - 10),
          y: Math.min(e.clientY + 20, window.innerHeight - tooltipHeight - 10),
        });
      } else {
        setPosition({
          x: Math.min(e.clientX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 10),
          y: Math.max(e.clientY - tooltipHeight - 10, 10),
        });
      }
    }
  };

  // For mobile, we use onClick instead of hover
  const mobileEvents = isMobile ? {
    onClick: handleTouchStart,
    onTouchStart: handleTouchStart,
  } : {};

  // For desktop, we use hover events
  const desktopEvents = !isMobile ? {
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  } : {};

  return (
    <div
      className="relative inline-block"
      {...mobileEvents}
      {...desktopEvents}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'celestial-tooltip',
            isMobile ? 'celestial-tooltip-mobile' : '',
            className
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * MobileCard - A simplified card component optimized for mobile displays
 */
export function MobileCard({
  children,
  title,
  className,
  icon,
  ...props
}) {
  return (
    <div 
      className={cn(
        'bg-deep-space bg-opacity-80 backdrop-blur-md rounded-lg p-3 shadow-lg',
        className
      )}
      {...props}
    >
      {title && (
        <div className="flex items-center mb-2">
          {icon && <span className="mr-2">{icon}</span>}
          <h3 className="text-md font-medium text-stardust-white">{title}</h3>
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}