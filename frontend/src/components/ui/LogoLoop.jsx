
import React, { useRef, useEffect, useState } from 'react';

const LogoLoop = ({
  logos = [],
  speed = 100,
  direction = 'left',
  logoHeight = 60,
  gap = 60,
  hoverSpeed = 0,
  scaleOnHover = false,
  fadeOut = true,
  fadeOutColor = '#ffffff', // Should match background color or be transparent if overlay
  ariaLabel = "Partners",
  className = "",
  useCustomRender = false, // If true, logos.node is expected to be fully rendered component
}) => {
  const containerRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Measure content width
  useEffect(() => {
    if (containerRef.current) {
      // Calculate total width based on children
      const children = containerRef.current.children;
      let totalWidth = 0;
      // We only measure the first set of items (half logic) or just assume average width
      // Better: measure the first instance of the set.
      if (children.length > 0) {
         // The content is duplicated, so we measure the first half
         const singleSetLength = logos.length;
         for (let i = 0; i < singleSetLength; i++) {
             if (children[i]) {
                totalWidth += children[i].offsetWidth + gap;
             }
         }
      }
      setContentWidth(totalWidth);
    }
  }, [logos, gap]);

  // Determine animation duration
  // Distance to travel is the width of one set of logos
  // Speed is pixels per second? Or generic speed factor?
  // Let's assume speed is pixels per second for consistency.
  const duration = contentWidth > 0 && speed > 0 ? contentWidth / speed : 20;

  // Pause on hover if speed is 0 or user wants it
  const currentDuration = isHovered && hoverSpeed !== undefined ? (contentWidth / hoverSpeed) : duration;
  const isPaused = isHovered && hoverSpeed === 0;

  return (
    <div 
      className={`relative overflow-hidden w-full ${className}`}
      style={{ height: logoHeight ? `${logoHeight}px` : 'auto' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label={ariaLabel}
    >
      {/* Fade Out Gradients */}
      {fadeOut && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-0 z-10 w-12 pointer-events-none"
            style={{ 
              background: `linear-gradient(to right, ${fadeOutColor}, transparent)` 
            }}
          />
          <div 
            className="absolute right-0 top-0 bottom-0 z-10 w-12 pointer-events-none"
            style={{ 
              background: `linear-gradient(to left, ${fadeOutColor}, transparent)` 
            }}
          />
        </>
      )}

      {/* Scrolling Container */}
      <div
        ref={containerRef}
        className="flex absolute left-0 top-0 h-full items-center"
        style={{
          gap: `${gap}px`,
          animation: `scroll-${direction} ${isPaused ? '0s' : `${duration}s`} linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          width: 'max-content',
        }}
      >
        {/* Original Set */}
        {logos.map((logo, index) => (
          <div 
            key={`original-${index}`}
            className={`flex-shrink-0 flex items-center justify-center transition-transform duration-300 ${scaleOnHover ? 'hover:scale-110' : ''}`}
            style={{ height: '100%' }}
          >
            {useCustomRender ? (
                // If customized, just render the node
                logo.node
            ) : logo.src ? (
              // Image based
              <a 
                href={logo.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block h-full"
                title={logo.title || logo.alt}
              >
                <img 
                  src={logo.src} 
                  alt={logo.alt || logo.title} 
                  className="h-full w-auto object-contain select-none"
                  draggable="false"
                />
              </a>
            ) : (
                // Node based (components or text)
               <a
                   href={logo.href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block text-inherit no-underline"
                   title={logo.title}
                >
                    {logo.node}
                </a>
            )}
          </div>
        ))}

        {/* Duplicate Set for Loop */}
        {logos.map((logo, index) => (
          <div 
            key={`duplicate-${index}`}
            className={`flex-shrink-0 flex items-center justify-center transition-transform duration-300 ${scaleOnHover ? 'hover:scale-110' : ''}`}
            style={{ height: '100%' }}
          >
             {useCustomRender ? (
                logo.node
            ) : logo.src ? (
              <a 
                href={logo.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block h-full"
                title={logo.title || logo.alt}
              >
                <img 
                  src={logo.src} 
                  alt={logo.alt || logo.title} 
                  className="h-full w-auto object-contain select-none"
                  draggable="false"
                />
              </a>
            ) : (
               <a
                   href={logo.href}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="block text-inherit no-underline"
                   title={logo.title}
                >
                    {logo.node}
                </a>
            )}
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        @keyframes scroll-right {
          0% { transform: translateX(-50%); } 
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LogoLoop;
