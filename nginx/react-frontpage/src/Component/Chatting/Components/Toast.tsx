import React, { useEffect, useRef } from 'react';
import { ToastProps } from '../Types';

interface ToastWithIndexProps extends ToastProps {
  index?: number; // 토스트의 순서(0부터 시작)
  show?: boolean; // 토스트를 보여줄지 여부
}

const MOBILE_BASE_BOTTOM = 80; // 모바일에서 첫 토스트의 bottom 위치(더 위로)
const MOBILE_GAP = 80; // px, 토스트 간 간격 (64 → 80으로 증가)
const PC_BASE_TOP = 32; // px, PC에서 첫 토스트의 top 위치(우측상단)
const PC_GAP = 80; // px, 토스트 간 간격 (64 → 80으로 증가)

const Toast: React.FC<ToastWithIndexProps> = ({ 
  message, 
  type, 
  onClose,
  index = 0,
  show = true
}) => {
  const closedRef = useRef(false);

  useEffect(() => {
    if (!show || !message || !type) return;
    closedRef.current = false;
    const timer = setTimeout(() => {
      if (!closedRef.current) {
        closedRef.current = true;
        onClose();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose, message, type, show]);

  // show가 true이고 message/type이 있을 때만 렌더링
  if (!show || !message || !type) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const isMobile = window.innerWidth < 640;

  return (
    <div
      className={`
        ${getBackgroundColor()} text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between
        transition-opacity duration-500 max-w-xs min-w-[320px] min-h-[56px]
        fixed z-50
        ${isMobile
          ? 'left-1/2 -translate-x-1/2'
          : 'right-8 left-auto translate-x-0'}
      `}
      style={
        isMobile
          ? { pointerEvents: 'auto', bottom: `${MOBILE_BASE_BOTTOM + index * MOBILE_GAP}px` }
          : { pointerEvents: 'auto', top: `${PC_BASE_TOP + index * PC_GAP}px` }
      }
    >
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