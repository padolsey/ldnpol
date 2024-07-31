import React, { useState, useEffect, useRef } from 'react';

interface GentleTypedMessageProps {
  message: string;
  typingSpeed?: number;
  isStreaming?: boolean;
}

const GentleTypedMessage: React.FC<GentleTypedMessageProps> = ({
  message,
  typingSpeed = 10,
  isStreaming = false,
}) => {
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [newContent, setNewContent] = useState<string[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const typeNextChar = () => {
      if (currentIndexRef.current < message.length) {
        setDisplayedMessage(message.slice(0, currentIndexRef.current + 1));
        currentIndexRef.current++;
        typingTimeoutRef.current = window.setTimeout(typeNextChar, typingSpeed);
      }
    };

    if (typingTimeoutRef.current !== null) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (currentIndexRef.current < message.length) {
      typeNextChar();
    }

    return () => {
      if (typingTimeoutRef.current !== null) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, typingSpeed]);

  const updateAriaContent = () => {
    if (!contentRef.current) return;
    const currentContent = contentRef.current.textContent?.trim() || '';
    setNewContent((prev) => [...prev, currentContent]);
  };

  useEffect(() => {
    const timer = window.setTimeout(updateAriaContent, 2500);
    return () => clearTimeout(timer);
  }, [displayedMessage]);

  return (
    <div className="gentle-typed-message">
      <div
        ref={contentRef}
        aria-hidden="true"
      >
        <span dangerouslySetInnerHTML={{ __html: displayedMessage }} />
      </div>

      {newContent.map((content, idx) => (
        <div
          key={idx}
          className="aria-status-hidden"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {content}
        </div>
      ))}
    </div>
  );
};

export default GentleTypedMessage;