import React from 'react';

const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-gray-600 text-white p-3 rounded-lg animate-pulse">
      <span>로딩 중</span>
      <span className="dot-flash">.</span>
      <span className="dot-flash delay-200">.</span>
      <span className="dot-flash delay-400">.</span>
    </div>
  );
};

export default LoadingMessage;