import React, { useState } from 'react';
import Chatting from '../Component/Chatting/Chatting';

// Message 타입 정의
type Message = {
  user: string;
  className: string;
  text: string;
  type: string; // 메시지 유형 ("client" 또는 "user" 등)
};

const Home: React.FC = () => {
  // 환영 메시지를 상수로 분리하여 재사용 가능하게 함
  const WELCOME_MESSAGE = {
    user: '',
    className: 'self-start',
    text: '안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.',
    type: 'client',
  };

  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);

  // 메시지 전송 함수 수정 - 특수 메시지 타입 처리 추가
  const handleSendMessage = (message: Message) => {
    // 메시지 초기화 요청 처리
    if (message.type === 'clear_messages') {
      // 메시지를 초기화하되 환영 메시지만 유지
      setMessages([WELCOME_MESSAGE]);
    } else {
      // 일반 메시지 추가
      setMessages((prevMessages) => [...prevMessages, message]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center w-full justify-center">
        <div className="relative w-full h-[calc(100vh)]">
          <Chatting messages={messages} onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default Home;
