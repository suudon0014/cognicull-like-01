import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  formula: string;
  displayMode?: boolean;
}

export const MathFormula: React.FC<MathFormulaProps> = ({ formula, displayMode = true }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current && formula) {
      // Clean leading/trailing $ if present
      const cleanFormula = formula.replace(/^\$+|\$+$/g, '').trim();
      try {
        katex.render(cleanFormula, containerRef.current, {
          displayMode,
          throwOnError: false,
        });
      } catch (err) {
        console.error('KaTeX render error:', err);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return <div ref={containerRef} className="my-2 overflow-x-auto text-sky-200 font-serif" />;
};
