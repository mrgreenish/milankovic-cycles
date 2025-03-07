import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ObservatoryButton } from './ObservatoryPanel';

export function NavigationMenu({ onTourClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Toggle Button */}
      <ObservatoryButton
        variant="secondary"
        className="flex items-center space-x-2 bg-deep-space bg-opacity-80 backdrop-blur-md hover:bg-slate-blue/30 transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Navigation Menu"
      >
        <span className="text-pale-gold">Menu</span>
        <span className="text-stardust-white transition-transform duration-300" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          {isOpen ? '×' : '☰'}
        </span>
      </ObservatoryButton>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-48 bg-deep-space border border-slate-blue rounded-md overflow-hidden shadow-lg z-50"
          style={{
            animation: 'fadeInSlideDown 0.3s ease-out forwards',
            transformOrigin: 'top left'
          }}
        >
          <style jsx>{`
            @keyframes fadeInSlideDown {
              from {
                opacity: 0;
                transform: translateY(-10px) scale(0.95);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          <div className="p-2 space-y-1">
            <ObservatoryButton
              variant="menu"
              className="w-full justify-start hover:bg-slate-blue hover:bg-opacity-20 transition-colors"
              onClick={() => {
                onTourClick();
                setIsOpen(false);
              }}
            >
              <span className="mr-2">🔭</span> Interactive Tour
            </ObservatoryButton>
            
            <Link href="/about" className="block">
              <ObservatoryButton
                variant="menu"
                className="w-full justify-start hover:bg-slate-blue hover:bg-opacity-20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-2">ℹ️</span> About the Project
              </ObservatoryButton>
            </Link>
            
            <Link href="/faq" className="block">
              <ObservatoryButton
                variant="menu"
                className="w-full justify-start hover:bg-slate-blue hover:bg-opacity-20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <span className="mr-2">❓</span> FAQ
              </ObservatoryButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 