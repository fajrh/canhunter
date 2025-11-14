import React, { useEffect, useState } from 'react';
import { t } from '../services/localization';
import type { Language } from '../types';

interface FlashMessageProps {
  messageKey: string | null;
  language: Language;
}

const FlashMessage: React.FC<FlashMessageProps> = ({ messageKey, language }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (messageKey) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1350); // a bit shorter than engine timeout
      return () => clearTimeout(timer);
    }
  }, [messageKey]);

  if (!messageKey) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="text-4xl sm:text-6xl font-bold text-white p-4 sm:p-8 rounded-lg bg-black/50 backdrop-blur-sm"
        style={{
          textShadow: '0 0 10px rgba(255,215,0,0.8), 0 0 20px rgba(255,215,0,0.6)',
        }}
      >
        {t(messageKey, language)}
      </div>
    </div>
  );
};

export default FlashMessage;
