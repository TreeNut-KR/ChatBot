import React, { useState, FormEvent, useEffect, useRef } from 'react';

type Message = {
  user: string;
  className: string;
  text: string;
  type: string;
};

interface ChatHeaderProps {
  model: string;
  setModel: React.Dispatch<React.SetStateAction<string>>;
}

interface ChatMessageProps {
  user: string;
  text: string;
  className: string;
}

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
}

interface ChatFooterProps {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

type ChattingProps = {
  messages: Message[];
  onSend: (message: Message) => void;
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ model, setModel }) => (
  <div className="bg-gray-900 flex items-center justify-between px-5 py-2">
    <h1 className="text-lg text-white">TreeNut ChatBot</h1>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ user, text, className }) => (
  <div className={`p-2 rounded-lg max-w-[70%] break-words ${className}`}>
    {text}
  </div>
);

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading }) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex-1 flex flex-col p-2 overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.user === '나' ? 'justify-end' : 'justify-start'} mb-0.5`}
        >
          <ChatMessage user={msg.user} text={msg.text} className={msg.className} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start mb-0.5">
          <ChatMessage user="AI" text="로딩 중..." className="bg-gray-600 text-white" />
        </div>
      )}
    </div>
  );
};

const ChatFooter: React.FC<ChatFooterProps> = ({ userInput, setUserInput, handleSubmit, isLoading }) => (
  <form onSubmit={handleSubmit} className="bg-gray-900 p-2 flex gap-3 w-full">
    <input
      type="text"
      value={userInput}
      onChange={(e) => setUserInput(e.target.value)}
      placeholder="메시지를 입력하세요..."
      autoComplete="off"
      className="flex-1 p-2 rounded-lg bg-gray-800 text-white outline-none"
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

const Chatting: React.FC<ChattingProps> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>('Llama');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim() === '') return;

    appendMessage({
      user: '나',
      text: userInput,
      className: 'bg-indigo-500 text-black',
      type: '',
    });
    setUserInput('');
    setIsLoading(true);

    await sendToServer(model, userInput);
    setIsLoading(false);
  };

  const appendMessage = (message: Message) => {
    onSend(message);
  };

  const sendToServer = async (model: string, inputText: string) => {
    try {
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

        const requestBody = {
          input_data_set: inputText,
        google_access_set: "true"
      };

      const response = await fetch("http://localhost:8080/server/chatroom/office", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('응답 상태 코드:', response.status);
        throw new Error('서버 요청 실패');
      }

      const responseData = await response.json();

      // 응답 데이터 디버깅
      console.log('응답 데이터:', responseData);

      const aiMessage = responseData.message;

      appendMessage({
        user: 'AI',
        text: aiMessage,
        className: 'bg-gray-600 text-white self-start',
        type: '',
      });
    } catch (error) {
      console.error('에러 발생:', error); // 에러 로그 출력
      appendMessage({
        user: '시스템',
        text: '서버와의 연결 중 문제가 발생했습니다.',
        className: 'bg-gray-600 text-white self-start',
        type: 'client',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-900">
      <div className="flex flex-col text-white w-full h-full max-w-3xl">
        <ChatHeader model={model} setModel={setModel} />
        <main className="flex-1 flex flex-col">
          <ChatContainer messages={messages} isLoading={isLoading} />
        </main>
        <ChatFooter userInput={userInput} setUserInput={setUserInput} handleSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Chatting;
