import React, { useEffect, useRef } from 'react';
import { ToastProps } from '../Types';

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type, 
  onClose 
}) => {
  const closedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!closedRef.current) {
        closedRef.current = true;
        onClose();
      }
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };
  
  return (
    <div className={`${getBackgroundColor()} text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between transition-opacity duration-500 max-w-xs`}>
      <span>{message}</span>
      <button 
        onClick={() => {
          if (!closedRef.current) {
            closedRef.current = true;
            onClose();
          }
        }}
        className="ml-2 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
};

export default Toast;