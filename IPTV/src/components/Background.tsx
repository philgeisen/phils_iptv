// src/components/Background.tsx
import React from "react";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#081025] via-[#0b0b16] to-[#120a2a] animate-gradient-xy" />
      {/* subtle animated mesh using SVG */}
      <svg
        className="absolute inset-0 w-full h-full mix-blend-overlay opacity-20"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#6327ff" />
            <stop offset="50%" stopColor="#0a84ff" />
            <stop offset="100%" stopColor="#ff6b6b" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
        <g opacity="0.06">
          <circle cx="10%" cy="20%" r="400" fill="#fff" />
          <circle cx="80%" cy="40%" r="300" fill="#fff" />
        </g>
      </svg>

      <style>{`
        @keyframes gradient-xy {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        .animate-gradient-xy {
          background-size: 200% 200%;
          animation: gradient-xy 12s ease infinite;
        }
      `}</style>
    </div>
  );
}
