import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ObservatoryButton } from './ObservatoryPanel';

/**
 * MobileNavigation - A mobile-specific navigation component
 * This component provides a hamburger menu and slide-out navigation for mobile devices
 */
export function MobileNavigation({ children, className, menuRef, ...props }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to close the menu that can be passed to children
  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  // Prevent body scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);
  
  return (
    <>
      {/* Menu button */}
      <div className={cn('mobile-nav', className)} {...props}>
        <ObservatoryButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 w-10 h-10 flex items-center justify-center"
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <HamburgerIcon isOpen={isMenuOpen} />
        </ObservatoryButton>
      </div>
      
      {/* Mobile menu */}
      <div 
        ref={menuRef}
        className={cn('mobile-menu', isMenuOpen && 'open')}
        onTouchStart={(e) => {
          // Only stop propagation for the menu background, not for buttons or other interactive elements
          if (e.target === e.currentTarget || e.target.classList.contains('space-y-4')) {
            e.stopPropagation();
          }
        }}
      >
        <div className="space-y-4">
          {React.Children.map(children, child => {
            // Add closeMenu prop to all children
            if (React.isValidElement(child)) {
              return React.cloneElement(child, { closeMenu });
            }
            return child;
          })}
        </div>
      </div>
      
      {/* Control panel handle */}
      <div 
        className="control-panel-handle hidden sm:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      />
    </>
  );
}

/**
 * BottomSheet - A mobile-specific bottom drawer component
 * This component provides a draggable bottom sheet for mobile controls
 */
export function BottomSheet({ children, className, title, ...props }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Prevent touch events from propagating to the canvas when interacting with the bottom sheet
  const handleTouchStart = (e) => {
    // Don't stop propagation for the handle itself
    if (!e.target.classList.contains('control-panel-handle')) {
      e.stopPropagation();
    }
  };
  
  return (
    <div 
      className={cn(
        'control-panel',
        isExpanded && 'expanded',
        className
      )}
      onTouchStart={handleTouchStart}
      {...props}
    >
      <div 
        className="control-panel-handle"
        onClick={() => setIsExpanded(!isExpanded)}
      />
      
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-opacity-20 border-slate-blue">
          <h3 className="text-lg font-serif text-stardust-white">{title}</h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-stardust-white opacity-70 hover:opacity-100"
            aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '↓' : '↑'}
          </button>
        </div>
      )}
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

/**
 * HamburgerIcon - A simple animated hamburger menu icon
 */
function HamburgerIcon({ isOpen }) {
  return (
    <div className="relative w-6 h-5">
      <span 
        className={cn(
          "absolute h-0.5 w-full bg-stardust-white rounded-sm transition-all duration-300",
          isOpen ? "top-2 rotate-45" : "top-0"
        )}
      />
      <span 
        className={cn(
          "absolute h-0.5 w-full bg-stardust-white rounded-sm transition-all duration-300",
          isOpen ? "opacity-0" : "top-2 opacity-100"
        )}
      />
      <span 
        className={cn(
          "absolute h-0.5 w-full bg-stardust-white rounded-sm transition-all duration-300",
          isOpen ? "top-2 -rotate-45" : "top-4"
        )}
      />
    </div>
  );
}

/**
 * MobileControlGroup - A component for grouping mobile controls
 */
export function MobileControlGroup({ children, className, title, closeMenu, ...props }) {
  return (
    <div className={cn('space-y-3 mb-4', className)} {...props}>
      {title && (
        <h4 className="text-sm font-medium text-stardust-white opacity-70">
          {title}
        </h4>
      )}
      <div className="space-y-2">
        {React.Children.map(children, child => {
          // Add closeMenu prop to all children
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { closeMenu });
          }
          return child;
        })}
      </div>
    </div>
  );
}

/**
 * MobileOnlyView - A component that only renders on mobile screens
 */
export function MobileOnlyView({ children, breakpoint = 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const checkIfMobile = () => {
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280
      };
      
      setIsMobile(window.innerWidth < breakpoints[breakpoint]);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [breakpoint]);
  
  // Don't render anything on the server or during first client render
  if (!mounted) return null;
  
  if (!isMobile) return null;
  
  return <>{children}</>;
}

/**
 * DesktopOnlyView - A component that only renders on desktop screens
 */
export function DesktopOnlyView({ children, breakpoint = 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    const checkIfDesktop = () => {
      const breakpoints = {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280
      };
      
      setIsDesktop(window.innerWidth >= breakpoints[breakpoint]);
    };
    
    checkIfDesktop();
    window.addEventListener('resize', checkIfDesktop);
    
    return () => window.removeEventListener('resize', checkIfDesktop);
  }, [breakpoint]);
  
  // Don't render anything on the server or during first client render
  if (!mounted) return null;
  
  if (!isDesktop) return null;
  
  return <>{children}</>;
} 