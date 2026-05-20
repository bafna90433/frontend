// ════════════════════════════════════════════════════════════
// ANIMATED COUNTER COMPONENT
// Extracted from Homepage.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

import React, { useEffect, useState, useRef } from "react";

const AnimatedCounter: React.FC<{
  target: string | number;
  duration?: number;
}> = ({ target, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const targetNum =
            parseInt(String(target).replace(/\D/g, ""), 10) || 4900;
          let start: number | null = null;
          const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * targetNum));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(targetNum);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString("en-IN")}
      {String(target).replace(/[0-9.,]/g, "")}
    </span>
  );
};

export default AnimatedCounter;
