import React from 'react';

interface ControlsProps {
  onUpgrades: () => void;
  onHelp: () => void;
  onMute: () => void;
  isMuted: boolean;
}

const Controls: React.FC<ControlsProps> = ({ onUpgrades, onHelp, onMute, isMuted }) => {
  const buttonBaseClasses = "p-3 sm:p-4 rounded-full text-2xl sm:text-3xl transition-transform duration-200 active:scale-90";
  const secondaryButtonClasses = `${buttonBaseClasses} bg-gray-700/80 text-white backdrop-blur-sm`;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
      <div className="flex flex-col space-y-3">
         <button onClick={onMute} className={secondaryButtonClasses}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button onClick={onHelp} className={secondaryButtonClasses}>
          ❓
        </button>
      </div>
      
      <div className="flex flex-col space-y-3 items-center">
        {/* Sell button removed as selling is now automatic */}
      </div>

      <div className="flex flex-col space-y-3">
        <button 
            onClick={onUpgrades} 
            className={`${secondaryButtonClasses} text-lg sm:text-xl font-bold px-4 sm:px-6`}
            style={{paddingTop: '0.8rem', paddingBottom: '0.8rem'}} // fine-tune padding for text
        >
          Upgrades
        </button>
      </div>
    </div>
  );
};

export default Controls;