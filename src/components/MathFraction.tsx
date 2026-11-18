import React from 'react';

interface MathFractionProps {
  num: number | string;
  den?: number | string;
  sign?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

export const MathFraction: React.FC<MathFractionProps> = ({
  num,
  den,
  sign,
  color = 'text-teal-300',
  size = 'md',
  isActive = false,
}) => {
  if (!den) {
    return (
      <span className={`inline-flex items-center font-bold font-mono transition-all duration-300 ${
        isActive ? 'text-yellow-300 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]' : color
      } ${size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg'}`}>
        {sign && <span className="mr-1 text-slate-300">{sign}</span>}
        {num}
      </span>
    );
  }

  const textSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  const minW = size === 'lg' ? 'min-w-[28px]' : size === 'sm' ? 'min-w-[18px]' : 'min-w-[22px]';

  return (
    <span className={`inline-flex items-center align-middle mx-1 font-mono transition-all duration-300 p-0.5 rounded-lg ${
      isActive 
        ? 'scale-105 bg-yellow-400/15 ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' 
        : ''
    }`}>
      {sign && <span className="mx-1 text-slate-300 font-bold">{sign}</span>}
      <span className="inline-flex flex-col items-center justify-center text-center leading-none">
        <span className={`${textSize} font-bold transition-colors duration-300 ${isActive ? 'text-yellow-300 font-black' : color} px-1.5 pb-0.5 ${minW}`}>
          {num}
        </span>
        <span className={`w-full transition-all duration-300 ${isActive ? 'bg-yellow-400 h-[2px]' : 'bg-slate-400 h-[1.5px]'} block my-0.5 rounded-full`} />
        <span className={`${textSize} font-bold transition-colors duration-300 ${isActive ? 'text-emerald-300 font-black' : 'text-amber-300'} px-1.5 pt-0.5 ${minW}`}>
          {den}
        </span>
      </span>
    </span>
  );
};
