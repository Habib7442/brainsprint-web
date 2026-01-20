import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
  className?: string;
  block?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '', block = false }) => {
  if (!text) return null;

  // Helper to render math using KaTeX
  const renderMath = (latex: string, isBlock: boolean) => {
    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock
      });
      return (
        <span 
          dangerouslySetInnerHTML={{ __html: html }} 
          className="px-0.5" 
        />
      );
    } catch (error) {
      console.error("KaTeX Error:", error);
      return <span>${latex}$</span>;
    }
  };

  const parts = text.split('$');

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Even index = regular text
        if (index % 2 === 0) {
           // Check for common math patterns missing $ delimiters
           // Matches:
           // 1. Exponents: 7^77 or 7^{77}
           // 2. LaTeX commands: \sqrt{2}, \frac{1}{2}, \pi, etc.
           const mathPattern = /(\d+\^(\d+|\{[^}]+\})|(\w+_\{?[^}]+\}??)|\\[a-zA-Z]+(?:\{[^}]+\})*)/g;
           
           if (!part.match(mathPattern)) {
               return <span key={index}>{part}</span>;
           }

           const elements: React.ReactNode[] = [];
           let lastIndex = 0;
           let match;
           
           while ((match = mathPattern.exec(part)) !== null) {
               // Push text before match
               if (match.index > lastIndex) {
                   elements.push(<span key={`${index}-text-${lastIndex}`}>{part.slice(lastIndex, match.index)}</span>);
               }
               
               // Render the math
               // match[0] contains the full sequence (e.g., "7^77" or "\sqrt{2}")
               // For exponents specifically, we might want to ensure braces, but strict latex usually allows 1 char arg.
               // Let KaTeX handle the parsing of the string as-is, just wrapping it.
               
               // But for our specific "implicit exponent" fix earlier: 7^77 needs to be 7^{77} because standard latex ^ only takes 1 char.
               // We need to distinguish or just blindly wrap standard patterns.
               
               let latex = match[0];
               
               // Special fix for simple number^number pattern to ensure braces
               // e.g. 7^77 -> 7^{77}
               const expMatch = latex.match(/^(\d+)\^(\d+)$/);
               if (expMatch) {
                   latex = `${expMatch[1]}^{${expMatch[2]}}`;
               }

               elements.push(
                   <span key={`${index}-math-${match.index}`}>
                       {renderMath(latex, false)}
                   </span>
               );
               
               lastIndex = mathPattern.lastIndex;
           }
           // Push remaining text
           if (lastIndex < part.length) {
               elements.push(<span key={`${index}-text-end`}>{part.slice(lastIndex)}</span>);
           }
           
           return <span key={index}>{elements}</span>;
        }
        
        // Odd index = explicit math content ($...$)
        if (!part) return null; 
        return <span key={index}>{renderMath(part, block)}</span>;
      })}
    </span>
  );
};

export default MathRenderer;
