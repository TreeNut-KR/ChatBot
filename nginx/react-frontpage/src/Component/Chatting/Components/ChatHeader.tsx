import React from 'react';
import { ChatHeaderProps } from '../Types';

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  model, 
  setModel, 
  googleAccess, 
  setGoogleAccess,
  onMenuClick 
}) => (
  <div className="bg-gray-900 flex flex-col sm:flex-row items-center justify-between px-5 py-2 border-b border-gray-800 gap-2">
    <h1 className="text-lg text-white font-semibold">TreeNut ChatBot</h1>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="googleAccess" 
          checked={googleAccess === "true"}
          onChange={(e) => {
            console.log("체크박스 상태 변경:", e.target.checked);
            setGoogleAccess(e.target.checked ? "true" : "false");
          }}
          className="h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="googleAccess" className="text-gray-400 text-sm cursor-pointer whitespace-nowrap">
          Google 접근
        </label>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">모델:</span>
        <select 
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-gray-800 text-white px-2 py-1 rounded-md border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all text-sm"
        >
          <option value="Llama">Llama</option>
          <option value="gpt4o_mini">gpt4o_mini</option>
          <option value="gpt4.1">gpt4.1</option>
          <option value="gpt4.1_mini">gpt4.1_mini</option>
        </select>
      </div>

      <button 
        onClick={onMenuClick}
        className="text-white hover:bg-gray-700 p-2 rounded-md transition-colors"
        aria-label="채팅방 목록"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  </div>
);

export default ChatHeader;