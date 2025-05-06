import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '../Component/Header/Header';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// 쿠키에서 값을 읽어오는 함수
const getCookieValue = (name: string): string => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return '';
};

// Character 인터페이스 정의
interface Character {
  idx: number;
  uuid: string;
  characterName: string;
  description: string;
  image: string;
  greeting?: string;
  creator?: string;
}

// Message 인터페이스 정의
interface Message {
  id: number;
  sender: 'user' | 'character';
  content: string;
  timestamp: string;
}

const CharacterChatRoom: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const decodedUuid = decodeURIComponent(uuid || '');
  console.log('Decoded URL UUID:', decodedUuid); // URL에서 받은 UUID 값 확인

  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState('gpt4.1'); // 기본 모델 설정
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 새로운 메시지가 추가될 때 스크롤 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 메시지가 변경될 때마다 스크롤 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const jwtToken = getCookieValue('jwt-token'); // 쿠키에서 JWT 토큰 가져오기

        // UUID를 기반으로 character_idx 및 채팅 로그 가져오기
        const logsResponse = await axios.get(`/server/chatroom/character/${decodedUuid}/load_logs`, {
          headers: {
            Authorization: jwtToken,
          },
        });
        const logsData = logsResponse.data;

        if (!logsData || logsData.status !== 200 || !logsData.logs || !logsData.logs.character_idx) {
          setDebugInfo({
            uuidFromUrl: decodedUuid,
            logsResponse: logsData,
          });
          throw new Error('캐릭터 로그 정보를 가져오는데 실패했습니다.');
        }

        const characterIdx = logsData.logs.character_idx;

        // character_idx를 사용하여 캐릭터 상세 정보 가져오기
        const detailsResponse = await axios.get(`/server/character/details/idx/${characterIdx}`);
        const detailsData = detailsResponse.data;

        if (!detailsData) {
          setDebugInfo({
            uuidFromUrl: decodedUuid,
            logsResponse: logsData,
            detailsResponse: detailsResponse,
          });
          throw new Error('캐릭터 상세 정보를 가져오는데 실패했습니다.');
        }

        setCharacter(detailsData);

        // 채팅 로그를 메시지 배열로 변환
        const chatLogs = Array.isArray(logsData.logs.value)
          ? logsData.logs.value.map((log: any, idx: number) => [
              {
                id: log.index * 2 - 1,
                sender: 'user',
                content: log.input_data,
                timestamp: log.timestamp,
              },
              {
                id: log.index * 2,
                sender: 'character',
                content: log.output_data,
                timestamp: log.timestamp,
              },
            ]).flat()
          : [];

        // greeting이 있으면 제일 앞에 추가
        if (detailsData.greeting) {
          chatLogs.unshift({
            id: 0,
            sender: 'character',
            content: detailsData.greeting,
            timestamp: new Date().toISOString(),
          });
        }

        setMessages(chatLogs);
        setLoading(false);
      } catch (err: any) {
        setDebugInfo({
          errorMessage: err.message,
          errorResponse: err.response || null,
        });
        setError('캐릭터 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    fetchCharacterDetails();
  }, [decodedUuid]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
  
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
  
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage('');
  
    try {
      const jwtToken = getCookieValue('jwt-token');
      if (!jwtToken) {
        throw new Error('로그인이 필요합니다.');
      }
  
      const response = await axios.post(
        `/server/chatroom/character/${decodedUuid}/get_response`,
        {
          input_data_set: newMessage,
          route_set: selectedModel,
        },
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      // 응답에서 여러 필드 중 실제 답변이 있는 곳을 우선적으로 사용
      const data = response.data;
      const answer =
        data.response ||
        data.output_data ||
        data.result ||
        data.message ||
        '응답을 받지 못했습니다.';
  
      const characterResponse: Message = {
        id: Date.now() + 1,
        sender: 'character',
        content: answer,
        timestamp: new Date().toISOString(),
      };
  
      setMessages((prevMessages) => [...prevMessages, characterResponse]);
    } catch (err) {
      console.error('메시지 전송 중 오류가 발생했습니다:', err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'character',
        content: '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    }
  };

  // 마크다운 컴포넌트 - 코드 블록 커스텀 렌더링
  const MarkdownRenderer = ({ content }: { content: string }) => (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={atomDark}
              language={match[1]}
              PreTag="div"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={`${className} rounded px-1 py-0.5 bg-gray-800`} {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="font-bold mb-2">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-500 pl-2 text-gray-300 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {children}
          </a>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
        <Header />
        <div className="flex w-full max-w-[1280px] justify-center p-4 text-white text-center py-10">
          로딩 중...
        </div>
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
        <Header />
        <div className="flex w-full max-w-[1280px] justify-center p-4 text-red-500 text-center py-10">
          {error || '캐릭터 정보를 불러올 수 없습니다.'}
        </div>
        {debugInfo && (
          <div className="flex flex-col items-start w-full max-w-[1280px] p-4 text-white bg-[#2a2928] rounded-lg">
            <h3 className="text-lg font-bold mb-4">디버깋 정보</h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="w-full h-[calc(100vh-120px)] flex flex-col">
          <div className="flex items-center mb-6 p-4 bg-[#2a2928] rounded-lg">
            <img
              src={character.image || '/default-character.png'}
              alt={character.characterName}
              className="w-12 h-12 rounded-full object-cover mr-4"
            />
            <div>
              <h2 className="text-xl font-bold text-white">{character.characterName}</h2>
              <p className="text-gray-400 text-sm">{character.description}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-[#2a2928] rounded-lg mb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'character' && (
                  <img
                    src={character.image || '/default-character.png'}
                    alt={character.characterName}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                )}
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    message.sender === 'user'
                      ? 'bg-[#3b7cc9] text-white'
                      : 'bg-[#3f3f3f] text-white'
                  }`}
                >
                  <MarkdownRenderer content={message.content} />
                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {message.sender === 'user'}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-[#2a2928] rounded-lg">
            <div className="flex">
              {/* 모델 선택 드롭다운 */}
              <select
                aria-label="Select AI model"
                className="p-3 rounded-l-lg bg-[#3f3f3f] text-white border-none focus:outline-none"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)} // 선택된 모델 값 업데이트
              >
                <option value="Llama">Llama</option>
                <option value="gpt4.1">GPT4.1</option>
                <option value="gpt4.1_mini">GPT4.1-mini</option>
              </select>

              {/* 입력창 */}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 p-3 bg-[#3f3f3f] text-white border-none focus:outline-none"
              />

              {/* 전송 버튼 */}
              <button
                onClick={handleSendMessage}
                className="px-6 py-3 bg-[#3b7cc9] text-white rounded-r-lg hover:bg-[#2d62a0]"
              >
                전송
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterChatRoom;
