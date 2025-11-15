import React from 'react';

interface InventoryFullPromptProps {
  text: string;
}

const InventoryFullPrompt: React.FC<InventoryFullPromptProps> = ({ text }) => {
  return (
    <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 z-40">
      <span
        className="block text-[32px] font-black uppercase tracking-[0.2em] text-yellow-200 drop-shadow-[0_0_12px_rgba(0,0,0,0.85)] animate-[pulse_0.6s_ease-in-out_infinite]"
      >
        {text}
      </span>
    </div>
  );
};

export default React.memo(InventoryFullPrompt);
