import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ObservatoryButton } from './ObservatoryPanel';

export function GuidedTour({ steps, currentStep, onNext, onPrev, onClose, isOpen }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Pause simulation when tour starts
    if (isOpen) {
      // Add highlight to current target
      const targetEl = document.getElementById(steps[currentStep]?.target);
      if (targetEl) {
        targetEl.classList.add('tour-highlight');
      }
    }
    
    return () => {
      // Remove highlight from all elements when tour closes
      steps.forEach(step => {
        const el = document.getElementById(step.target);
        if (el) {
          el.classList.remove('tour-highlight');
        }
      });
    };
  }, [isOpen, currentStep, steps]);
  
  useEffect(() => {
    // Remove highlight from previous step and add to current
    steps.forEach((step, index) => {
      const el = document.getElementById(step.target);
      if (el) {
        if (index === currentStep) {
          el.classList.add('tour-highlight');
        } else {
          el.classList.remove('tour-highlight');
        }
      }
    });
  }, [currentStep, steps]);
  
  // Don't render on server
  if (!mounted || !isOpen) return null;
  
  const currentTourStep = steps[currentStep];
  if (!currentTourStep) return null;
  
  // Calculate position
  const targetEl = document.getElementById(currentTourStep.target);
  let position = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect();
    
    switch (currentTourStep.position) {
      case 'right':
        position = {
          top: `${rect.top + rect.height/2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)'
        };
        break;
      case 'left':
        position = {
          top: `${rect.top + rect.height/2}px`,
          left: `${rect.left - 320}px`,
          transform: 'translateY(-50%)'
        };
        break;
      case 'top':
        position = {
          top: `${rect.top - 200}px`,
          left: `${rect.left + rect.width/2}px`,
          transform: 'translateX(-50%)'
        };
        break;
      case 'bottom':
        position = {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width/2}px`,
          transform: 'translateX(-50%)'
        };
        break;
    }
  }
  
  return createPortal(
    <div 
      className="fixed z-50 w-80 bg-deep-space bg-opacity-95 border border-aged-copper rounded-md p-4 shadow-lg backdrop-blur-md animate-fadeIn"
      style={position}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-serif text-pale-gold">
          {currentTourStep.title}
        </h3>
        <button 
          onClick={onClose}
          className="text-stardust-white opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
      
      <p className="text-sm text-stardust-white mb-4">
        {currentTourStep.content}
      </p>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-stardust-white opacity-70">
          Step {currentStep + 1} of {steps.length}
        </div>
        
        <div className="flex space-x-2">
          {currentStep > 0 && (
            <ObservatoryButton
              onClick={onPrev}
              variant="ghost"
              className="text-sm py-1 px-3"
            >
              Previous
            </ObservatoryButton>
          )}
          
          {currentStep < steps.length - 1 ? (
            <ObservatoryButton
              onClick={onNext}
              variant="primary"
              className="text-sm py-1 px-3"
            >
              Next
            </ObservatoryButton>
          ) : (
            <ObservatoryButton
              onClick={onClose}
              variant="primary"
              className="text-sm py-1 px-3"
            >
              Finish
            </ObservatoryButton>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function TourButton({ onClick }) {
  return (
    <ObservatoryButton
      onClick={onClick}
      variant="ghost"
      className="flex items-center space-x-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>Tour</span>
    </ObservatoryButton>
  );
} 