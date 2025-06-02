import React from 'react';
import { ChatHeaderProps } from '../Types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  model, 
  setModel, 
  googleAccess, 
  setGoogleAccess,
  onMenuClick 
}) => (
  <div className="bg-gray-900 flex items-center justify-between px-5 py-2 border-b border-gray-800 h-14 relative">
    {/* PC/모바일 모두 우측에 햄버거 버튼 */}
    <div className="absolute left-5 top-1/2 -translate-y-1/2 sm:hidden"></div>
    <h1 className="text-lg text-white font-semibold text-center w-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
      TreeNut ChatBot
    </h1>
    <button
      onClick={onMenuClick}
      className="text-white hover:bg-gray-700 p-2 rounded-md transition-colors sm:hidden ml-2 absolute right-5 top-1/2 -translate-y-1/2"
      aria-label="채팅방 목록"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
    <button
      onClick={onMenuClick}
      className="text-white hover:bg-gray-700 p-2 rounded-md transition-colors hidden sm:block ml-2 absolute right-5 top-1/2 -translate-y-1/2"
      aria-label="채팅방 목록"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  </div>
);

export default ChatHeader;