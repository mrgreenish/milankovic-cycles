import React from 'react';
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
 */
export function ObservatoryPanel({
  children,
  title,
  className,
  variant = 'default',
  glowing = false,
  icon,
  ...props
}) {
  // Define variant-specific classes
  const variantClasses = {
    default: 'observatory-panel',
    control: 'control-panel',
    data: 'observatory-panel bg-opacity-50 border-aged-copper',
    info: 'observatory-panel bg-opacity-40 border-slate-blue',
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
        <div className="flex items-center px-4 py-2 border-b border-opacity-20 border-slate-blue">
          {icon && <span className="mr-2">{icon}</span>}
          <h3 className="text-lg font-serif text-stardust-white">{title}</h3>
        </div>
      )}
      <div className="p-4">
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
 * DataDisplay - A component for displaying data values in the Celestial Observatory design
 */
export function DataDisplay({
  label,
  value,
  unit,
  className,
  ...props
}) {
  return (
    <div className={cn('data-display', className)} {...props}>
      <div className="text-xs text-stardust-white opacity-80">{label}</div>
      <div className="flex items-baseline">
        <span className="text-lg font-mono text-pale-gold">{value}</span>
        {unit && <span className="ml-1 text-xs text-stardust-white opacity-70">{unit}</span>}
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
  const [isVisible, setIsVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const tooltipRef = React.useRef(null);

  const handleMouseEnter = (e) => {
    setIsVisible(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (isVisible) {
      updatePosition(e);
    }
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const updatePosition = (e) => {
    if (tooltipRef.current) {
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      
      // Position the tooltip above the cursor
      setPosition({
        x: Math.min(e.clientX - tooltipWidth / 2, window.innerWidth - tooltipWidth - 10),
        y: Math.max(e.clientY - tooltipHeight - 10, 10),
      });
    }
  };

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
      {isVisible && (
        <div 
          ref={tooltipRef}
          className={cn('celestial-tooltip', className)}
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