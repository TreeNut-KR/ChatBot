import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Component/Header/Header';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CharacterChatSidebar from '../Component/CharacterMain/CharacterChatSidebar';
// api.ts의 함수 가져오기
import { 
  loadCharacterChatLogs, 
  getCharacterResponse, 
  fetchCharacterChatRooms, 
  getCharacterDetails,
  getUserId,
  deleteCharacterChatLog,
  updateCharacterChatLog
} from '../Component/Chatting/Services/api';

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
  index?: number; // index 필드 추가
}

const CharacterChatRoom: React.FC = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const decodedUuid = decodeURIComponent(uuid || '');
  
  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState('Llama'); // 기본 모델 설정
  const [myRooms, setMyRooms] = useState<
    { roomid: string; Title: string; character_name: string; character_img: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false); // 메시지 전송 중 상태 추가
  const [editMode, setEditMode] = useState(false); // 수정 모드 여부
  const [editMessage, setEditMessage] = useState(''); // 수정할 메시지
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

  // 채팅방이 변경될 때마다 상태 초기화 - api.ts 활용
  useEffect(() => {
    // 상태 초기화
    setMessages([]);
    setCharacter(null);
    setError(null);
    setLoading(true);

    const fetchCharacterDetails = async () => {
      try {
        // 1. 채팅 로그 먼저 불러오기 - api.ts 활용
        const logsData = await loadCharacterChatLogs(decodedUuid);

        if (!logsData || !logsData.logs || !logsData.logs.character_idx) {
          setError('채팅 로그 정보를 가져오는데 실패했습니다.');
          setLoading(false);
          return;
        }

        const characterIdx = logsData.logs.character_idx;

        // 2. 캐릭터 정보 불러오기 - api.ts 활용
        let detailsData = null;
        try {
          detailsData = await getCharacterDetails(characterIdx);
        } catch (error) {
          console.error('캐릭터 정보 로딩 실패:', error);
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
                  index: log.index, // index 추가
                },
                {
                  id: log.index * 2,
                  sender: 'character',
                  content: log.output_data,
                  timestamp: log.timestamp,
                  index: log.index, // index 추가
                },
              ]).flat()
            : [];

          // 인사말 메시지 생성
          let greetingMessage: Message | null = null;
          if (detailsData.greeting) {
            greetingMessage = {
              id: -1, // 항상 최상단에 위치하도록 음수 ID 사용
              sender: 'character',
              content: detailsData.greeting,
              timestamp: '', // 인사말은 시간 표시 안 함
            };
          }

          // 인사말을 항상 최상단에 유지
          setMessages(greetingMessage ? [greetingMessage, ...chatLogs] : chatLogs);
        } else {
          setCharacter(null);
          setError('존재하지 않는 캐릭터입니다.');
        }
        setLoading(false);
      } catch (err: any) {
        console.error('채팅 정보 로딩 오류:', err);
        setError('채팅 정보를 불러오는데 실패했습니다.');
        setLoading(false);
      }
    };

    if (decodedUuid) {
      fetchCharacterDetails();
    }
  }, [decodedUuid]); // uuid가 바뀔 때마다 실행

  // 내 채팅방 목록 불러오기 - api.ts 활용
  useEffect(() => {
    const fetchMyRooms = async () => {
      try {
        const rooms = await fetchCharacterChatRooms();
        setMyRooms(rooms);
      } catch (e) {
        console.error('채팅방 목록을 불러오는데 실패했습니다.', e);
      }
    };
    
    fetchMyRooms();

    // 포커스 될 때마다 목록 새로고침
    window.addEventListener('focus', fetchMyRooms);
    return () => window.removeEventListener('focus', fetchMyRooms);
  }, []);

  // 메시지 전송 - api.ts 활용
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true); // 전송 중 상태로 변경

    // 가장 마지막 메시지의 index를 찾음
    const lastIndex = messages
      .filter((msg) => typeof msg.index === 'number')
      .reduce((max, msg) => Math.max(max, msg.index ?? 0), 0);

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      index: lastIndex + 1, // 사용자 메시지도 index 부여
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setNewMessage('');

    try {
      // api.ts의 getCharacterResponse 호출
      const response = await getCharacterResponse(decodedUuid, newMessage, selectedModel);

      // 응답에서 여러 필드 중 실제 답변이 있는 곳을 우선적으로 사용
      const data = response;
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
        index: lastIndex + 1, // 답변 메시지도 index 부여
      };

      setMessages((prevMessages) => [...prevMessages, characterResponse]);
    } catch (err) {
      console.error('메시지 전송 중 오류가 발생했습니다:', err);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'character',
        content: '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
        index: lastIndex + 1, // 오류 메시지도 index 부여
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsSending(false); // 전송 완료 후 상태 해제
    }
  };

  const handleRoomClick = (roomid: string) => {
    setSidebarOpen(false);
    navigate(`/chat/${encodeURIComponent(roomid)}`);
  };

  // 대화 삭제 핸들러
  const handleDeleteChatFromIndex = async (index: number | undefined) => {
    if (!index) return;
    if (!window.confirm(`${index}번 index부터 최신까지의 대화를 삭제하시겠습니까?`)) return;
    try {
      await deleteCharacterChatLog(decodedUuid, index);
      // 삭제 후 메시지 새로고침
      const logsData = await loadCharacterChatLogs(decodedUuid);
      const characterIdx = logsData.logs.character_idx;
      let detailsData = null;
      try {
        detailsData = await getCharacterDetails(characterIdx);
      } catch (error) {
        detailsData = null;
      }
      const chatLogs = Array.isArray(logsData.logs.value)
        ? logsData.logs.value.map((log: any, idx: number) => [
            {
              id: log.index * 2 - 1,
              sender: 'user',
              content: log.input_data,
              timestamp: log.timestamp,
              index: log.index,
            },
            {
              id: log.index * 2,
              sender: 'character',
              content: log.output_data,
              timestamp: log.timestamp,
              index: log.index,
            },
          ]).flat()
        : [];
      let greetingMessage: Message | null = null;
      if (detailsData && detailsData.greeting) {
        greetingMessage = {
          id: -1,
          sender: 'character',
          content: detailsData.greeting,
          timestamp: '',
        };
      }
      setMessages(greetingMessage ? [greetingMessage, ...chatLogs] : chatLogs);
    } catch (e) {
      alert('대화 삭제 중 오류가 발생했습니다.');
    }
  };

  // 최신 index 계산
  const latestIndex = React.useMemo(() => {
    const idxArr = messages
      .filter((msg) => typeof msg.index === 'number')
      .map((msg) => msg.index as number);
    return idxArr.length > 0 ? Math.max(...idxArr) : undefined;
  }, [messages]);

  // 최신 user 메시지 찾기
  const latestUserMsg = React.useMemo(
    () =>
      messages
        .filter((msg) => msg.sender === 'user' && msg.index === latestIndex)
        .slice(-1)[0],
    [messages, latestIndex]
  );

  // 수정 버튼 클릭 시
  const handleEditClick = () => {
    if (latestUserMsg) {
      setEditMode(true);
      setEditMessage(latestUserMsg.content);
      setNewMessage(''); // 입력창 비움
    }
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditMessage('');
  };

  // 수정 전송
  const handleEditSubmit = async () => {
    if (!editMessage.trim() || !latestIndex) return;
    setIsSending(true);
    try {
      await updateCharacterChatLog(decodedUuid, editMessage, selectedModel);
      // 수정 후 대화 새로고침
      const logsData = await loadCharacterChatLogs(decodedUuid);
      const characterIdx = logsData.logs.character_idx;
      let detailsData = null;
      try {
        detailsData = await getCharacterDetails(characterIdx);
      } catch (error) {
        detailsData = null;
      }
      const chatLogs = Array.isArray(logsData.logs.value)
        ? logsData.logs.value.map((log: any, idx: number) => [
            {
              id: log.index * 2 - 1,
              sender: 'user',
              content: log.input_data,
              timestamp: log.timestamp,
              index: log.index,
            },
            {
              id: log.index * 2,
              sender: 'character',
              content: log.output_data,
              timestamp: log.timestamp,
              index: log.index,
            },
          ]).flat()
        : [];
      let greetingMessage: Message | null = null;
      if (detailsData && detailsData.greeting) {
        greetingMessage = {
          id: -1,
          sender: 'character',
          content: detailsData.greeting,
          timestamp: '',
        };
      }
      setMessages(greetingMessage ? [greetingMessage, ...chatLogs] : chatLogs);
      setEditMode(false);
      setEditMessage('');
    } catch (e) {
      alert('대화 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSending(false);
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
              {messages.map((message, idx) => {
                // 인사말 메시지는 항상 최상단에 character로 표시
                if (idx === 0 && message.id === -1 && message.sender === 'character') {
                  return (
                    <div
                      key="greeting"
                      className="mb-6 flex justify-start"
                    >
                      <img
                        src={character.image || '/images/default-character.png'}
                        alt={character.characterName}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                      <div className="p-3 rounded-lg max-w-[70%] bg-[#3f3f3f] text-white border-l-4 border-blue-400">
                        <MarkdownRenderer content={message.content} />
                        {/* 인사말은 시간 표시 없음 */}
                      </div>
                    </div>
                  );
                }
                // 일반 메시지
                const isLatestUser =
                  message.sender === 'user' &&
                  message.index === latestIndex;
                return (
                  <div
                    key={message.id}
                    className={`relative mb-4 flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    } group`}
                  >
                    {message.sender === 'character' && (
                      <img
                        src={character.image || '/images/default-character.png'}
                        alt={character.characterName}
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                    )}
                    <div
                      className={`relative p-4 rounded-lg bg-[#2e2d2c] text-white group-hover:bg-[#3a3938] transition max-w-[70%] ${
                        message.sender === 'user'
                          ? 'bg-[#3b7cc9] text-white'
                          : 'bg-[#2e2d2c] text-white'
                      }`}
                    >
                      {/* 수정 모드일 때 최신 user input만 점멸 효과 */}
                      {isLatestUser && editMode ? (
                        <div className="animate-pulse">
                          <MarkdownRenderer content={editMessage} />
                        </div>
                      ) : (
                        <MarkdownRenderer content={message.content} />
                      )}
                      <div
                        className={`flex items-center text-xs mt-1 ${
                          message.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        {/* 시간 */}
                        <span>
                          {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {/* index가 있고 character 메시지일 때만 삭제 버튼 표시 */}
                        {message.sender === 'character' && message.index !== undefined && (
                          <button
                            className="ml-2 text-xs text-gray-400 hover:text-red-500 active:text-red-600 bg-transparent flex items-center gap-1 transition-colors"
                            title={`${message.index}번 index부터 최신까지 삭제`}
                            onClick={() => handleDeleteChatFromIndex(message.index)}
                            tabIndex={0}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h8M6 9h2M5 3h4l1 1h2v2H2V4h2l1-1z" />
                            </svg>
                            여기서부터 최신까지 삭제
                          </button>
                        )}
                        {/* 최신 user input에만 수정 버튼 */}
                        {isLatestUser && !editMode && (
                          <button
                            className="ml-2 text-xs text-gray-400 hover:text-blue-500 active:text-blue-600 bg-transparent flex items-center gap-1 transition-colors"
                            title="최신 입력 수정"
                            onClick={handleEditClick}
                            tabIndex={0}
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M2 12.5V17h4.5l9.1-9.1-4.5-4.5L2 12.5zM17.7 6.3a1 1 0 0 0 0-1.4l-2.6-2.6a1 1 0 0 0-1.4 0l-1.1 1.1 4.5 4.5 1.1-1.1z"/>
                            </svg>
                            수정
                          </button>
                        )}
                      </div>
                    </div>
                    {message.sender === 'user'}
                  </div>
                );
              })}
              {/* 로딩 중 표시 */}
              {isSending && (
                <div className="mb-4 flex justify-start">
                  <div className="p-3 rounded-lg max-w-[70%] bg-[#3f3f3f] text-white opacity-80">
                    <span className="animate-pulse">답변 생성 중...</span>
                  </div>
                </div>
              )}
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
                  disabled={editMode}
                >
                  <option value="Llama">Free</option>
                  <option value="gpt4.1_mini">Pro</option>
                  <option value="gpt4.1">Pro+</option>
                </select>

                {/* 입력창: 수정모드면 editMessage, 아니면 newMessage */}
                <textarea
                  value={editMode ? editMessage : newMessage}
                  onChange={(e) =>
                    editMode
                      ? setEditMessage(e.target.value)
                      : setNewMessage(e.target.value)
                  }
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                  placeholder=""
                  className="flex-1 p-3 bg-[#3f3f3f] text-white border-none focus:outline-none rounded-lg resize-none overflow-y-auto"
                  rows={1}
                  style={{ maxHeight: '120px', minWidth: editMode ? '0' : '120px' }}
                  disabled={isSending}
                ></textarea>

                {/* 취소 버튼: 수정모드일 때만 노출 */}
                {editMode && (
                  <button
                    onClick={handleCancelEdit}
                    className="w-11 h-11 flex items-center justify-center bg-red-600 text-white rounded-lg hover:bg-red-700 flex-shrink-0 transition-colors"
                    style={{ fontSize: '22px', fontWeight: 'bold' }}
                    aria-label="수정 취소"
                  >
                    ⨉
                  </button>
                )}

                {/* 전송 버튼 */}
                <button
                  onClick={editMode ? handleEditSubmit : handleSendMessage}
                  className={`w-11 h-11 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors ${
                    editMode
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-[#3b7cc9] text-white hover:bg-[#2d62a0]'
                  }`}
                  disabled={isSending}
                  style={{ fontSize: '22px', fontWeight: 'bold' }}
                  aria-label="전송"
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
