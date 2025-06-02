import React from 'react';
import { ChatFooterProps } from '../Types';

const ChatFooter: React.FC<ChatFooterProps> = ({ userInput, setUserInput, handleSubmit, isLoading, scrollToBottom }) => (
  <form onSubmit={handleSubmit} className="bg-gray-900 p-2 flex gap-3 w-full relative shrink-0">
    <button
      onClick={scrollToBottom}
      type="button"
      className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white p-2 px-3 rounded-full"
    >
      ▼
    </button>
    <input
      type="text"
      value={userInput}
      onChange={(e) => setUserInput(e.target.value)}
      placeholder="메시지를 입력하세요..."
      autoComplete="off"
      className="flex-1 p-2 rounded-lg bg-gray-800 text-white outline-none select-text touch-manipulation caret-white"
    />
    <button
      type="submit"
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg text-white ${
        isLoading ? 'bg-gray-700 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600'
      }`}
    >
      전송
    </button>
  </form>
);

export default ChatFooter;