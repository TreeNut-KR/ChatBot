import React, { useEffect } from 'react';
import ChatMessage from './ChatMessage';
import LoadingMessage from './LoadingMessage';
import { Message, ChatContainerProps } from '../Types';
import useResponsiveScale from '../../../hooks/useResponsiveScale';

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading, chatContainerRef, handleRetrySend }) => {
  const scale = useResponsiveScale();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={chatContainerRef}
      className="flex-1 overflow-auto px-4 pt-4 pb-32 chat-scrollbar bg-gray-900 rounded-b-xl"
    >
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.user === '나' ? 'justify-end' : 'justify-start'}`}>
          <ChatMessage
            {...msg}
            retry={msg.user === '나' ? () => handleRetrySend(msg) : undefined}
          />
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