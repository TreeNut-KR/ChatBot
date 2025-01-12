import React, { useState } from 'react';
import Chatting from '../Component/Chatting/Chatting';
import Header from '../Component/Header/Header';

// Message 타입 정의
type Message = {
  user: string;
  className: string;
  text: string;
  type: string; // 메시지 유형 ("client" 또는 "user" 등)
};

const Home: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      user: '',
      className: 'self-start',
      text: '안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.',
      type: 'client',
    },
  ]);

  // 메시지 전송 함수
  const handleSendMessage = (message: Message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <Header />
      <div className="flex items-center w-full justify-center h-full">
        <div className="relative max-w-[808px] p-5 pt-10 pb-24 w-full h-[calc(100vh-100px)]">
          <Chatting messages={messages} onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Home;
