import React from 'react';

/**
 * Parses text and converts URLs into clickable links
 * @param text - The text to parse
 * @returns React elements with links converted to anchor tags
 */
export function parseTextWithLinks(text: string): React.ReactNode[] {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Component that renders text with clickable URLs
 */
interface TextWithLinksProps {
  children: string;
  className?: string;
}

export function TextWithLinks({ children, className }: TextWithLinksProps) {
  return (
    <span className={className}>
      {parseTextWithLinks(children)}
    </span>
  );
}