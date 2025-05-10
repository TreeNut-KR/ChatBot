import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../Component/Header/Header';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CharacterChatSidebar from '../Component/CharacterMain/CharacterChatSidebar';

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
  const [selectedModel, setSelectedModel] = useState('Llama'); // 기본 모델 설정
  const [myRooms, setMyRooms] = useState<
    { roomid: string; Title: string; character_name: string; character_img: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 새로운 메시지가 추가될 때 스크롤 아래로 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 메시지가 변경될 때마다 스크롤 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 채팅방이 변경될 때마다 상태 초기화
  useEffect(() => {
    // 상태 초기화
    setMessages([]);
    setCharacter(null);
    setError(null);
    setLoading(true);
    
    const fetchCharacterDetails = async () => {
      try {
        const jwtToken = getCookieValue('jwt-token');
        // 1. 채팅 로그 먼저 불러오기
        const logsResponse = await axios.get(`/server/chatroom/character/${decodedUuid}/load_logs`, {
          headers: { Authorization: jwtToken },
        });
        const logsData = logsResponse.data;

        if (!logsData || logsData.status !== 200 || !logsData.logs || !logsData.logs.character_idx) {
          setError('채팅 로그 정보를 가져오는데 실패했습니다.');
          setLoading(false);
          return;
        }

        const characterIdx = logsData.logs.character_idx;

        // 2. 캐릭터 정보 불러오기
        let detailsData = null;
        try {
          const detailsResponse = await axios.get(`/server/character/details/idx/${characterIdx}`);
          detailsData = detailsResponse.data;
        } catch {
          detailsData = null;
        }

        if (detailsData) {
          setCharacter(detailsData);

          // 3. 채팅 로그를 메시지 배열로 변환
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

          setMessages(chatLogs);

          // 채팅 기록이 없을 경우 인사말 추가
          if (chatLogs.length === 0 && detailsData.greeting) {
            const greetingMessage: Message = {
              id: Date.now(),
              sender: 'character',
              content: detailsData.greeting,
              timestamp: new Date().toISOString(),
            };
            setMessages([greetingMessage]);
          }
        } else {
          setCharacter(null);
          setError('존재하지 않는 캐릭터입니다.');
        }
        setLoading(false);
      } catch (err: any) {
        setError('채팅 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    if (decodedUuid) {
      fetchCharacterDetails();
    }
  }, [decodedUuid]); // uuid가 바뀔 때마다 실행

  // 내 채팅방 목록 불러오기
  useEffect(() => {
    const fetchMyRooms = async () => {
      try {
        const token = getCookieValue('jwt-token');
        if (!token) return;
        const res = await axios.get('/server/chatroom/character/find_my_rooms', {
          headers: { Authorization: token },
        });
        if (res.data?.status === 200 && Array.isArray(res.data.rooms)) {
          setMyRooms(res.data.rooms);
        }
      } catch (e) {
        // 필요시 에러 처리
      }
    };
    fetchMyRooms();

    // 포커스 될 때마다 목록 새로고침
    window.addEventListener('focus', fetchMyRooms);
    return () => window.removeEventListener('focus', fetchMyRooms);
  }, []);

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

  const handleRoomClick = (roomid: string) => {
    setSidebarOpen(false);
    navigate(`/chat/${encodeURIComponent(roomid)}`);
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
        em: ({ children }) => (
          <em className="text-gray-400 italic">{children}</em>
        ),
        strong: ({ children }) => (
          <strong className="text-gray-400 italic">{children}</strong>
        ),
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
        {debugInfo}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <header className="flex justify-between items-center w-full h-[56px] px-5 bg-[#1a1918] border-b border-transparent relative">
        <button
          type="button"
          className="text-lg font-bold text-white px-4 py-2 rounded transition duration-200 flex items-center justify-center"
          onClick={() => navigate('/CharacterChat')}
          aria-label="홈으로 이동"
        >
          <i className="fas fa-home fa-lg"></i>
        </button>
        {/* 햄버거 버튼 */}
        <button
          className="absolute top-1/2 right-6 -translate-y-1/2 z-50 text-white hover:bg-[#353535] p-2 rounded-md"
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="채팅방 목록 열기"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="8" x2="23" y2="8" />
            <line x1="5" y1="14" x2="23" y2="14" />
            <line x1="5" y1="20" x2="23" y2="20" />
          </svg>
        </button>
      </header>
      <div className="flex w-full max-w-[1280px] justify-center p-4 gap-6">
        {/* 사이드바 */}
        <CharacterChatSidebar
          rooms={myRooms}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectRoom={handleRoomClick}
        />
        {/* 채팅 메인 영역 */}
        <div className="flex-1 w-0">
          <div className="w-full h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center mb-6 p-4 bg-[#2a2928] rounded-lg">
              <img
                src={character.image || '/images/default-character.png'}
                alt={character.characterName}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h2 className="text-xl font-bold text-white">{character.characterName}</h2>
                <p
                  className="text-gray-400 text-sm"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {character.description}
                </p>
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
                      src={character.image || '/images/default-character.png'}
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
              <div className="flex items-center w-full gap-2">
                {/* 모델 선택 드롭다운 */}
                <select
                  aria-label="Select AI model"
                  className="w-[80px] p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none flex-shrink-0"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="Llama">Free</option>
                  <option value="gpt4.1_mini">Pro</option>
                  <option value="gpt4.1">Pro+</option>
                </select>

                {/* 입력창 */}
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto'; // 높이를 초기화
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`; // 최대 높이 120px (5줄)
                  }}
                  placeholder=""
                  className="flex-1 p-3 bg-[#3f3f3f] text-white border-none focus:outline-none rounded-lg resize-none overflow-y-auto"
                  rows={1} // 기본 줄 수
                  style={{ maxHeight: '120px' }} // 최대 높이 (5줄)
                ></textarea>

                {/* 전송 버튼 */}
                <button
                  onClick={handleSendMessage}
                  className="w-[45px] px-4 py-3 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0] flex-shrink-0"
                >
                  ▶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterChatRoom;
