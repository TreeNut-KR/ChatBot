import React, { useEffect, useRef } from "react";
import './text.css';


interface Message {
  type: string;
  text: string;
}


interface TextProps {
  messages: Message[];
}

const Text: React.FC<TextProps> = ({ messages }) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="Text" ref={chatContainerRef}>
      {messages.map((msg, index) => (
        <div key={index} className={`message ${msg.type}`}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}

export default Text;
