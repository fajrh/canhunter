import React from 'react';
import { t } from '../services/localization';
import type { Language } from '../types';

interface HelpModalProps {
  onClose: () => void;
  language: Language;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose, language }) => {
  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 text-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold">{t('help_title', language)} ❓</h2>
          <button onClick={onClose} className="text-3xl">&times;</button>
        </div>
        <div className="p-6 space-y-4 text-gray-300 overflow-y-auto">
            <p><strong>{t('help_goal_title', language)}</strong> {t('help_goal_desc', language)}</p>
            <p><strong>{t('help_controls_title', language)}</strong> {t('help_controls_desc', language)}</p>
            <p><strong>{t('help_hazards_title', language)}</strong> {t('help_hazards_desc', language)}</p>
            <p><strong>{t('help_rules_title', language)}</strong> {t('help_rules_desc', language)}</p>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
