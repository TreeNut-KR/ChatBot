import React, { useState, FormEvent, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./Chatting.css"

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

interface ChattingProps {
  messages: Message[];
  onSend: (message: Message) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ model }) => (
  <div className="bg-gray-900 flex items-center justify-between px-5 py-2">
    <h1 className="text-lg text-white">TreeNut ChatBot</h1>
  </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ text, className, user }) => {
  const isIntroMessage =
    text.includes("안녕하세요, 반갑습니다.") && text.includes("TreeNut 챗봇");

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2초 후 원래대로
    });
  };

  return (
    <div className={`relative p-3 rounded-lg max-w-[70%] break-words ${className} mb-6`}>
      {!isIntroMessage && (
        user === "나" ? (
          <div className="absolute right-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-l-[14px] border-t-transparent border-l-indigo-500"></div>
        ) : (
          <div className="absolute left-[-12px] bottom-2 w-0 h-0 
                          border-t-[12px] border-r-[14px] border-t-transparent border-r-gray-600"></div>
        )
      )}
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkBreaks]} 
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }) => (
            <a 
              style={{ color: "lightblue" }} 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ), 
          img: ({ node, ...props }) => <img style={{ maxWidth: "100%", borderRadius: "8px" }} {...props} />, 
          code: ({ node, children, className, ...props }) => {
            const isInline = !(className && className.includes("language-"));
            const codeString = String(children).trim();
            const language = className?.replace("language-", "") || "javascript"; // 기본값 JavaScript

            return isInline ? (
              <code style={{ backgroundColor: "#222", padding: "2px 5px", borderRadius: "4px" }} {...props}>
                {children}
              </code>
            ) : (
              <div className="relative">
                <SyntaxHighlighter language={language} style={atomDark} className="rounded-lg p-4">
                  {codeString}
                </SyntaxHighlighter>
                {/* 복사 버튼 */}
                <button
                  onClick={() => copyToClipboard(codeString)}
                  className="absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded-md hover:bg-gray-600 transition"
                >
                  {copied ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
            );
          },
        }}
      >
        {String(text)}
      </ReactMarkdown>
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
const LoadingMessage: React.FC = () => {
  return (
    <div className="flex items-center gap-2 bg-gray-600 text-white p-3 rounded-lg animate-pulse">
      <span>로딩 중</span>
      <span className="dot-flash">.</span>
      <span className="dot-flash delay-200">.</span>
      <span className="dot-flash delay-400">.</span>
    </div>
  );
};

const Chatting: React.FC<ChattingProps> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>('Llama');
  const chatContainerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const hasFetched = localStorage.getItem('hasFetched');
    if (!hasFetched || hasFetched === 'false') {
      getFromServer(model);
      localStorage.setItem('hasFetched', 'true');
    }
  }, [model]);

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

    await postToServer(model, userInput);
    setIsLoading(false);
  };

  const appendMessage = (message: Message) => {
    onSend(message);
  };

  const getFromServer = async (model: string, inputText?: string) => {
    try {
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      const url = new URL("http://localhost:8080/server/chatroom/office");
      if (inputText) {
        url.searchParams.append('input_data_set', inputText);
      }
      url.searchParams.append('google_access_set', "true");

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        console.error('응답 상태 코드:', response.status);
        throw new Error('서버 요청 실패');
      }

      const responseData = await response.json();
      console.log('응답 데이터:', responseData);

      const aiMessage = responseData.message.replace(/\\n/g, '\n').replace(/\\(?!n)/g, '');
      const roomId = responseData.mysql_officeroom.mongo_chatroomid;

      localStorage.setItem('mongo_chatroomid', roomId);

      appendMessage({
        user: 'AI',
        text: aiMessage,
        className: 'bg-gray-600 text-white self-start',
        type: '',
      });
    } catch (error) {
      console.error('에러 발생:', error);
      appendMessage({
        user: '시스템',
        text: '서버와의 연결 중 문제가 발생했습니다.',
        className: 'bg-gray-600 text-white self-start',
        type: 'client',
      });
    }
  };

  const postToServer = async (model: string, inputText: string) => {
    try {
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      const roomId = localStorage.getItem('mongo_chatroomid');
      if (!roomId) throw new Error('채팅방 ID가 없습니다.');

      const url = `http://localhost:8080/server/chatroom/office/${roomId}/get_response`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          input_data_set: inputText,
          google_access_set: "true",
        }),
      });

      if (!response.ok) {
        throw new Error('서버 요청 실패');
      }

      const responseData = await response.json();
      const aiMessage = responseData.message.replace(/\\n/g, '\n').replace(/\\(?!n)/g, '');
      appendMessage({ user: 'AI', text: aiMessage, className: 'bg-gray-600 text-white', type: '' });
    } catch (error) {
      console.error('에러 발생:', error);
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
