import { useState, useEffect } from 'react';

function NarrativeOverlay({ text }) {
  const [displayText, setDisplayText] = useState(text);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (text !== displayText) {
      setIsChanging(true);
      
      // Start fade out
      const timeout1 = setTimeout(() => {
        setDisplayText(text);
        
        // Start fade in
        const timeout2 = setTimeout(() => {
          setIsChanging(false);
        }, 50);
        
        return () => clearTimeout(timeout2);
      }, 300);
      
      return () => clearTimeout(timeout1);
    }
  }, [text, displayText]);

  return (
    <div className="narrative-overlay">
      <p className={`narrative-text ${isChanging ? 'changing' : 'visible'}`}>
        {displayText}
      </p>
    </div>
  );
}

export default NarrativeOverlay; 