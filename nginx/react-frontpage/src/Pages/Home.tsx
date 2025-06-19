import React, { useState } from 'react';
import Chatting from '../Component/Chatting/Chatting';
import { Message } from '../Component/Chatting/Types';

const WELCOME_MESSAGE: Message = {
  user: '',
  className: 'self-start',
  text: '안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.',
  type: 'client',
};

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  const handleSendMessage = (message: Message) => {
    if (message.type === 'clear_messages') {
      setMessages([WELCOME_MESSAGE]);
    } else {
      setMessages((prevMessages) => [...prevMessages, message]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center w-full justify-center">
        <div className="relative w-full h-[calc(100vh)]">
          <Chatting
            messages={messages}
            setMessages={setMessages}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
