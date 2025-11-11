import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for fade-out before dismissing
        setTimeout(onDismiss, 300);
      }, 2700);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [message, onDismiss]);

  return (
    <div
      className={`absolute top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-blue-500 text-white font-bold shadow-lg transition-all duration-300 pointer-events-none text-center ${
        isVisible && message ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;