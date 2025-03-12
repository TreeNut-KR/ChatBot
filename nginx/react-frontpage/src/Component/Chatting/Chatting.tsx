import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkHtml from 'remark-html';

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
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

interface ChatFooterProps {
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  scrollToBottom: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ model }) => (
  <div className="bg-gray-900 flex items-center justify-between px-5 py-2">
    <h1 className="text-lg text-white">TreeNut ChatBot</h1>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ text, className, user }) => {
  const isIntroMessage =
    text.includes("안녕하세요, 반갑습니다.") && text.includes("TreeNut 챗봇");

  return (
    <div className={`relative p-3 rounded-lg max-w-[70%] break-words ${className} mb-6`}>
      {/* 소개 문구가 아닐 때만 꼬리표 추가 */}
      {!isIntroMessage && (
        user === "나" ? (
          <div className="absolute right-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-l-[14px] border-t-transparent border-l-indigo-500"></div>
        ) : (
          <div className="absolute left-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-r-[14px] border-t-transparent border-r-gray-600"></div>
        )
      )}
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
};






const ChatContainer: React.FC<ChatContainerProps> = ({ messages, isLoading, chatContainerRef }) => {
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatContainerRef} className="flex-1 flex flex-col p-3 overflow-y-auto bg-gray-900 relative">
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.user === '나' ? 'justify-end' : 'justify-start'}`}>
          <ChatMessage user={msg.user} text={msg.text} className={msg.className} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <ChatMessage user="AI" text="로딩 중..." className="bg-gray-600 text-white" />
        </div>
      )}

    </div>
  );
};

const ChatFooter: React.FC<ChatFooterProps> = ({ userInput, setUserInput, handleSubmit, isLoading, scrollToBottom }) => (
  <form onSubmit={handleSubmit} className="bg-gray-900 p-2 flex gap-3 w-full relative">
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

const Chatting: React.FC<{ messages: Message[]; onSend: (message: Message) => void }> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('Llama');
  const chatContainerRef = useRef<HTMLDivElement>(null!); // 여기서 null!로 해결

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    appendMessage({ user: '나', text: userInput, className: 'bg-indigo-500 text-black', type: '' });
    setUserInput('');
    setIsLoading(true);
    await postToServer(userInput);
    setIsLoading(false);
  };

  const appendMessage = (message: Message) => {
    onSend(message);
  };

  const postToServer = async (inputText: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: inputText }),
      });

      if (!response.ok) throw new Error('서버 요청 실패');

      const responseData = await response.json();
      const parsedMessage = await unified().use(remarkParse).use(remarkHtml).process(responseData.message);

      appendMessage({ user: 'AI', text: String(parsedMessage), className: 'bg-gray-600 text-white', type: '' });
    } catch (error) {
      console.error(error);
      appendMessage({ user: '시스템', text: '서버 오류 발생', className: 'bg-gray-600 text-white', type: 'client' });
    }
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-900">
      <div className="flex flex-col text-white w-full h-full max-w-3xl bg-gray-900">
        <ChatHeader model={model} setModel={setModel} />
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          <ChatContainer messages={messages} isLoading={isLoading} chatContainerRef={chatContainerRef} />
          <ChatFooter userInput={userInput} setUserInput={setUserInput} handleSubmit={handleSubmit} isLoading={isLoading} scrollToBottom={scrollToBottom} />
        </main>
      </div>
    </div>
  );
};

export default Chatting;
