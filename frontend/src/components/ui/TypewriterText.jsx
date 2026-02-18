import React, { useState, useEffect, useRef } from 'react';

const TypewriterText = ({ 
  phrases = [], 
  typingSpeed = 80, 
  deletingSpeed = 40, 
  pauseDuration = 2000,
  className = '' 
}) => {
  const [text, setText] = useState('');
  const phraseIndexRef = useRef(0);
  const isDeletingRef = useRef(false);
  const textRef = useRef('');

  useEffect(() => {
    if (phrases.length === 0) return;

    let timer;

    const tick = () => {
      const currentPhrase = phrases[phraseIndexRef.current];
      const deleting = isDeletingRef.current;

      if (deleting) {
        textRef.current = textRef.current.slice(0, -1);
        setText(textRef.current);

        if (textRef.current === '') {
          isDeletingRef.current = false;
          phraseIndexRef.current = (phraseIndexRef.current + 1) % phrases.length;
          timer = setTimeout(tick, 300);
        } else {
          timer = setTimeout(tick, deletingSpeed);
        }
      } else {
        textRef.current = currentPhrase.slice(0, textRef.current.length + 1);
        setText(textRef.current);

        if (textRef.current === currentPhrase) {
          isDeletingRef.current = true;
          timer = setTimeout(tick, pauseDuration);
        } else {
          timer = setTimeout(tick, typingSpeed);
        }
      }
    };

    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, [phrases, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-current ml-0.5 animate-pulse align-middle" />
    </span>
  );
};

export default TypewriterText;
