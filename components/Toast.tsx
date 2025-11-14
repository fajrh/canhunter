import React, { useEffect, useState } from 'react';
import { t } from '../services/localization';
import type { Language } from '../types';

interface ToastProps {
  messageKey: string | null;
  onDismiss: () => void;
  language: Language;
}

const Toast: React.FC<ToastProps> = ({ messageKey, onDismiss, language }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (messageKey) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 2700);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [messageKey, onDismiss]);

  return (
    <div
      className={`absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-blue-500 text-white font-bold shadow-lg transition-all duration-300 pointer-events-none text-center ${
        isVisible && messageKey ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
      }`}
    >
      {messageKey ? t(messageKey, language) : ''}
    </div>
  );
};

export default Toast;
