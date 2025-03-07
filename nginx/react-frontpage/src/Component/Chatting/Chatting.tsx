import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({
  breaks: true,
});

type Message = {
  user: string;
  className: string;
  text: string;
  type: string;
};

const ChatMessage: React.FC<{ user: string; text: string; className: string }> = ({ user, text, className }) => {
  const noTailMessages = [
    "안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다."
  ];
  const showTail = !noTailMessages.includes(text);
  const [sanitizedText, setSanitizedText] = useState<string>("");

  useEffect(() => {
    const processText = async () => {
      const parsedText = await marked(text);
      setSanitizedText(DOMPurify.sanitize(parsedText));
    };

    processText();
  }, [text]);

  return (
    <div
      className={`relative p-3 rounded-lg max-w-[80%] break-words ${className} ${
        showTail
          ? user === '나'
            ? 'before:content-[" "] before:absolute before:top-1/2 before:right-[-12px] before:w-0 before:h-0 before:border-l-[12px] before:border-l-indigo-500 before:border-y-[6px] before:border-y-transparent before:translate-y-[-50%]'
            : 'before:content-[" "] before:absolute before:top-1/2 before:left-[-12px] before:w-0 before:h-0 before:border-r-[12px] before:border-r-gray-600 before:border-y-[6px] before:border-y-transparent before:translate-y-[-50%]'
          : ''
      }`}
    >
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedText }}
      />
    </div>
  );
};

const ChatContainer: React.FC<{ messages: Message[]; isLoading: boolean }> = ({ messages, isLoading }) => {
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  useEffect(() => {
    if (isAtBottom && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    setIsAtBottom(true);
  };

  return (
    <div className="relative flex-1 flex flex-col p-3 overflow-y-auto w-full max-w-6xl bg-gray-900" 
         ref={chatContainerRef} onScroll={handleScroll}>
      {messages.map((msg, index) => (
        <div key={index} className={`flex ${msg.user === '나' ? 'justify-end' : 'justify-start'} mb-4`}>
          <ChatMessage user={msg.user} text={msg.text} className={msg.className} />
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start mb-4">
          <ChatMessage user="AI" text="로딩 중..." className="bg-gray-600 text-white" />
        </div>
      )}
      {!isAtBottom && (
        <button
          className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-600 transition"
          onClick={scrollToBottom}
        >
          ↓
        </button>
      )}
    </div>
  );
};

const Chatting: React.FC<{ messages: Message[]; onSend: (message: Message) => void }> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim() === '') return;
    
    onSend({ user: '나', text: userInput, className: 'bg-indigo-500 text-black', type: '' });
    setUserInput('');
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-900">
      <div className="flex flex-col text-white w-full h-full max-w-6xl">
        <header className="bg-gray-900 flex items-center justify-between px-5 py-3">
          <h1 className="text-lg text-white">TreeNut ChatBot</h1>
        </header>
        <main className="flex-1 flex flex-col min-h-0 bg-gray-900">
          <ChatContainer messages={messages} isLoading={isLoading} />
        </main>
        <form onSubmit={handleSubmit} className="bg-gray-900 p-3 flex gap-3 w-full">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 p-3 rounded-lg bg-gray-800 text-white outline-none"
          />
          <button type="submit" disabled={isLoading} className="px-5 py-3 rounded-lg text-white bg-indigo-500 hover:bg-indigo-600">
            전송
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatting;
