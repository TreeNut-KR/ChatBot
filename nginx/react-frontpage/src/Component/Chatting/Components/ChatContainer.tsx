import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingMessage from './LoadingMessage';
import { ChatContainerProps } from '../Types';
import useResponsiveScale from '../../../hooks/useResponsiveScale';

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading, chatContainerRef }) => {
  const scale = useResponsiveScale(); // 배율 가져오기

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 flex flex-col min-h-0 p-3 overflow-y-auto bg-gray-900 relative scrollbar-hide"
      style={{
        fontSize: '1rem',
        padding: '1rem',
        width: `${100 + (scale - 1) * 50}%`,
        maxWidth: `${100 + (scale - 1) * 50}%`,
      }}
    >
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