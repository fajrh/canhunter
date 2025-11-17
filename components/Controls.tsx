import React from 'react';
import { t } from '../services/localization';
import type { Language } from '../types';

interface ControlsProps {
  onUpgrades: () => void;
  onHelp: () => void;
  onMute: () => void;
  isMuted: boolean;
  language: Language;
}

const Controls: React.FC<ControlsProps> = ({ onUpgrades, onHelp, onMute, isMuted, language }) => {
  const buttonBaseClasses = "p-3 sm:p-4 rounded-full text-2xl sm:text-3xl transition-transform duration-200 active:scale-90 pointer-events-auto";
  const secondaryButtonClasses = `${buttonBaseClasses} bg-gray-700/80 text-white backdrop-blur-sm`;

  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end pointer-events-none">
      <div className="flex flex-col space-y-3">
         <button onClick={onMute} className={secondaryButtonClasses} aria-label={t('toggle_mute', language)}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button onClick={onHelp} className={secondaryButtonClasses} aria-label={t('help_button', language)}>
          ❓
        </button>
      </div>

      <div className="flex flex-col space-y-3">
        <button 
            onClick={onUpgrades} 
            className={`${secondaryButtonClasses} text-lg sm:text-xl font-bold px-4 sm:px-6`}
            style={{paddingTop: '0.8rem', paddingBottom: '0.8rem'}}
        >
          {t('upgrades_button', language)}
        </button>
      </div>
    </div>
  );
};

export default Controls;
