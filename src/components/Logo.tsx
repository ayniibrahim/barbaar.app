import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export const Logo = ({ className = "", size = 32 }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span 
        className="font-black tracking-[-0.05em] text-text uppercase leading-none"
        style={{ fontSize: size * 0.8 }}
      >
        Barbaar
      </span>
    </div>
  );
};
