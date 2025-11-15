import React from 'react';

interface InventoryFullPromptProps {
  text: string;
}

const InventoryFullPrompt: React.FC<InventoryFullPromptProps> = ({ text }) => {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40">
      <span
        className="font-bold"
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          color: '#ff0000',
          animation: 'inventory-flash 0.8s step-start infinite',
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default React.memo(InventoryFullPrompt);
