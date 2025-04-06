import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingMessage from './LoadingMessage';
import { ChatContainerProps } from '../Types';

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading, chatContainerRef }) => {
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex-1 flex flex-col p-3 overflow-y-auto bg-gray-900 relative scrollbar-hide">
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.user === '나' ? 'justify-end' : 'justify-start'}`}>
          <ChatMessage user={msg.user} text={msg.text} className={msg.className} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <LoadingMessage />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;