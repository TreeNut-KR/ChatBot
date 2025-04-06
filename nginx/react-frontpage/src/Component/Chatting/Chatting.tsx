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
  googleAccess: boolean;
  setGoogleAccess: React.Dispatch<React.SetStateAction<boolean>>;
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

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const Toast: React.FC<{ message: string; type: string; onClose: () => void }> = ({ 
  message, 
  type, 
  onClose 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };
  
  return (
    <div className={`${getBackgroundColor()} text-white px-4 py-3 rounded-md shadow-lg flex items-center justify-between transition-opacity duration-500 max-w-xs`}>
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="ml-2 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
};

// ChatHeader 컴포넌트 모바일 대응 개선
const ChatHeader: React.FC<ChatHeaderProps> = ({ model, setModel, googleAccess, setGoogleAccess }) => (
  <div className="bg-gray-900 flex flex-col sm:flex-row items-center justify-between px-5 py-2 border-b border-gray-800 gap-2">
    <h1 className="text-lg text-white font-semibold">TreeNut ChatBot</h1>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="googleAccess" 
          checked={googleAccess} 
          onChange={(e) => setGoogleAccess(e.target.checked)}
          className="h-4 w-4 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="googleAccess" className="text-gray-400 text-sm cursor-pointer whitespace-nowrap">
          Google 접근
        </label>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm">모델:</span>
        <select 
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-gray-800 text-white px-2 py-1 rounded-md border border-gray-700 hover:border-indigo-500 cursor-pointer transition-all text-sm"
          aria-label="모델 선택"
        >
          <option value="Llama">Llama</option>
          <option value="gpt4o_mini">gpt4o_mini</option>
        </select>
      </div>
    </div>
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
  const [googleAccess, setGoogleAccess] = useState<boolean>(true); // 기본값 true로 설정
  const chatContainerRef = useRef<HTMLDivElement>(null!);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        // 채팅방 ID 확인
        const roomId = localStorage.getItem('mongo_chatroomid');
        
        // 계정 ID 확인 (계정 식별자로 사용)
        const currentUserId = localStorage.getItem('user_id');
        const previousUserId = localStorage.getItem('previous_user_id');
        
        // 새 채팅방을 만들어야 하는 조건들:
        // 1. 채팅방 ID가 없거나
        // 2. 사용자가 변경되었거나 (계정 전환)
        // 3. 메시지가 없는 경우
        if (!roomId || (currentUserId && currentUserId !== previousUserId) || messages.length === 0) {
          // 사용자 변경된 경우 이전 채팅방 정보 초기화
          if (currentUserId && currentUserId !== previousUserId) {
            localStorage.removeItem('mongo_chatroomid');
            // 현재 사용자 ID 저장
            localStorage.setItem('previous_user_id', currentUserId);
          }
          
          // 새 채팅방 생성
          await getFromServer(model);
        }
      } catch (error) {
        console.error('채팅 세션 초기화 실패:', error);
      }
    };
    
    initializeChatSession();
  }, [model, messages.length]);

  useEffect(() => {
    if (model && messages.length > 0) {
      // 모델이 변경되었을 때 사용자에게 알림 (배경색 변경)
      appendMessage({
        user: '시스템',
        text: `모델이 ${model}로 변경되었습니다.`,
        className: 'bg-gray-600 text-white text-center self-start', // 배경색을 서버 메시지와 동일하게 변경
        type: 'system',
      });
      showToast(`모델이 ${model}로 변경되었습니다.`, 'success');
    }
  }, [model]); // model이 변경될 때만 실행

  // Google 접근 설정 변경 시 알림 추가
  useEffect(() => {
    if (messages.length > 0) {
      appendMessage({
        user: '시스템',
        text: `Google 접근이 ${googleAccess ? '활성화' : '비활성화'}되었습니다.`,
        className: 'bg-gray-600 text-white text-center self-start',
        type: 'system',
      });
      showToast(`Google 접근이 ${googleAccess ? '활성화' : '비활성화'}되었습니다.`, 'info');
    }
  }, [googleAccess]); // googleAccess 변경 시 실행

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

      const url = new URL("/server/chatroom/office");

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
      showToast('서버와의 연결 중 문제가 발생했습니다.', 'error');
    }
  };

  const postToServer = async (model: string, inputText: string) => {
    try {
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      const roomId = localStorage.getItem('mongo_chatroomid');
      if (!roomId) throw new Error('채팅방 ID가 없습니다.');

      const url = `/server/chatroom/office/${roomId}/get_response`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          input_data_set: inputText,
          route_set: model, // 선택된 모델로 route_set 설정
          google_access_set: googleAccess ? "true" : "false", // 체크박스 상태에 따라 "true" 또는 "false" 문자열 전달
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
      
      // 오류 메시지 표시
      appendMessage({ 
        user: '시스템', 
        text: '응답을 받는 중 오류가 발생했습니다. 다시 시도해주세요.', 
        className: 'bg-red-600 text-white', 
        type: 'error' 
      });
      showToast('응답을 받는 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  };

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-900 relative">
      {/* Toast 컨테이너 */}
      <div className="fixed top-4 right-4 flex flex-col space-y-2 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className="animate-fadeInOut">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </div>
      
      <div className="flex flex-col text-white w-full h-full max-w-3xl bg-gray-900">
        <ChatHeader 
          model={model} 
          setModel={setModel} 
          googleAccess={googleAccess} 
          setGoogleAccess={setGoogleAccess} 
        />
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          <ChatContainer messages={messages} isLoading={isLoading} chatContainerRef={chatContainerRef} />
          <ChatFooter userInput={userInput} setUserInput={setUserInput} handleSubmit={handleSubmit} isLoading={isLoading} scrollToBottom={scrollToBottom} />
        </main>
      </div>
    </div>
  );
};

export default Chatting;
