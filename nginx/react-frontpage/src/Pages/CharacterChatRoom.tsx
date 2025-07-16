import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../Component/Header/Header';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CharacterChatSidebar from '../Component/CharacterMain/CharacterChatSidebar';
import CharacterDetailModal from '../Component/CharacterMain/CharacterDetailModal';
// api.ts의 함수 가져오기
import { 
  loadCharacterChatLogs, 
  getCharacterResponse, 
  fetchCharacterChatRooms, 
  getCharacterDetails,
  deleteCharacterChatLog,
  updateCharacterChatLog
} from '../Component/Chatting/Services/api';

interface Character {
  idx: number;
  uuid: string;
  characterName: string;
  description: string;
  image: string;
  creator: string; // creator는 userid로 세팅
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
  const [selectedModel, setSelectedModel] = useState('Llama');
  const [myRooms, setMyRooms] = useState<
    { roomid: string; Title: string; character_name: string; character_img: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [characterDetail, setCharacterDetail] = useState<Character | null>(null);
  const [membership, setMembership] = useState<'BASIC' | 'VIP'>('BASIC');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // 캐릭터 클릭 시 상세 정보 API 호출 후 모달 오픈
  const handleCharacterClick = async (character: Character) => {
    try {
      const detail = await getCharacterDetails(character.idx);

      // userid가 없으면 에러 처리
      if (
        typeof detail.userid !== 'string' ||
        detail.userid.trim() === ''
      ) {
        throw new Error('캐릭터 정보에 userid 필드가 없습니다.');
      }

      // Character 타입에 맞게 변환 (creator는 userid로 세팅)
      const characterDetail: Character = {
        idx: detail.idx,
        uuid: detail.uuid,
        characterName: detail.characterName,
        description: detail.description,
        image: detail.image,
        creator: detail.userid,
      };

      setCharacterDetail(characterDetail);
    } catch (e) {
      alert('캐릭터 상세 정보를 불러오지 못했습니다.');
      setCharacterDetail(null);
    }
  };

  // 캐릭터와 채팅하기 (채팅방에서는 모달만 닫음)
  const handleChat = () => {
    setCharacterDetail(null);
  };

  // 모바일 감지 useEffect 추가
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        // 1. 채팅 로그 먼저 불러오기
        const logsData = await loadCharacterChatLogs(decodedUuid);

        if (!logsData || !logsData.logs || !logsData.logs.character_idx) {
          setError('채팅 로그 정보를 가져오는데 실패했습니다.');
          setLoading(false);
          return;
        }

        const characterIdx = logsData.logs.character_idx;

        let detailsData = null;
        try {
          detailsData = await getCharacterDetails(characterIdx);
        } catch (error) {
          detailsData = null;
        }

        if (
          detailsData &&
          typeof detailsData.userid === 'string' &&
          detailsData.userid.trim() !== ''
        ) {
          // Character 타입에 맞게 변환 (creator는 userid로 세팅)
          const characterObj: Character = {
            idx: detailsData.idx,
            uuid: detailsData.uuid,
            characterName: detailsData.characterName,
            description: detailsData.description,
            image: detailsData.image,
            creator: detailsData.userid,
          };

          setCharacter(characterObj);

          // 3. 채팅 로그를 메시지 배열로 변환
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

          // 인사말 메시지 생성
          let greetingMessage: Message | null = null;
          if (detailsData.greeting) {
            greetingMessage = {
              id: -1,
              sender: 'character',
              content: detailsData.greeting,
              timestamp: '',
            };
          }

          setMessages(greetingMessage ? [greetingMessage, ...chatLogs] : chatLogs);
        } else {
          setCharacter(null);
          setError('캐릭터 정보에 userid 필드가 없거나 잘못되었습니다.');
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
  }, [decodedUuid]);

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

  // 키보드 이벤트 핸들러 추가
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (isMobile) {
        // 모바일: Enter만으로 줄바꿈 (기본 동작 허용)
        return;
      } else {
        // 데스크톱: Shift+Enter로 줄바꿈, Enter로 전송
        if (e.shiftKey) {
          // Shift+Enter: 줄바꿈 (기본 동작 허용)
          return;
        } else {
          // Enter: 전송
          e.preventDefault();
          if (editMode) {
            handleEditSubmit();
          } else {
            handleSendMessage();
          }
        }
      }
    }
  };

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
      index: lastIndex + 1, // 사용자 메시지에도 index 부여
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

  // splitMessageBlocks 함수 수정
  function splitMessageBlocks(content: string): { type: 'normal' | 'quote' | 'image', value: string }[] {
    const blocks: { type: 'normal' | 'quote' | 'image', value: string }[] = [];
    let rest = content;

    // 이미지 마크다운 먼저 분리
    const imgRegex = /!\[.*?\]\(.*?\)/g;
    let imgMatch;
    let lastIndex = 0;
    let imgSplits: { type: 'image' | 'text', value: string }[] = [];
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      if (imgMatch.index > lastIndex) {
        imgSplits.push({ type: 'text', value: content.slice(lastIndex, imgMatch.index) });
      }
      imgSplits.push({ type: 'image', value: imgMatch[0] });
      lastIndex = imgMatch.index + imgMatch[0].length;
    }
    if (lastIndex < content.length) {
      imgSplits.push({ type: 'text', value: content.slice(lastIndex) });
    }

    // 각 텍스트 블록에서 " " 분리
    imgSplits.forEach((part) => {
      if (part.type === 'image') {
        blocks.push({ type: 'image', value: part.value });
        return;
      }
      let text = part.value;
      let last = 0;
      const quoteRegex = /"([^"]+)"/g;
      let match;
      let normalBuffer = '';
      while ((match = quoteRegex.exec(text)) !== null) {
        // 앞에 일반 텍스트 누적
        if (match.index > last) {
          normalBuffer += text.slice(last, match.index);
        }
        // 버퍼에 쌓인 일반 텍스트가 있으면 하나의 normal 블록으로 추가
        if (normalBuffer.trim()) {
          blocks.push({ type: 'normal', value: normalBuffer });
          normalBuffer = '';
        }
        // 쌍따옴표 블록 추가
        blocks.push({ type: 'quote', value: match[1] });
        last = match.index + match[0].length;
      }
      // 남은 일반 텍스트
      if (last < text.length) {
        normalBuffer += text.slice(last);
      }
      if (normalBuffer.trim()) {
        blocks.push({ type: 'normal', value: normalBuffer });
      }
    });

    return blocks;
  }

  useEffect(() => {
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
    const fetchMembership = async () => {
      try {
        const jwtToken = getCookieValue('jwt-token');
        const res = await fetch('/server/user/membership', {
          method: 'GET',
          headers: { 'Authorization': jwtToken || '' },
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.membership) setMembership(data.membership);
        }
      } catch (e) {}
    };
    fetchMembership();
  }, []);

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
    <div className="w-full min-h-screen bg-[#1a1918]">
      {/* 상단 여유공간 추가 */}
      <div className="w-full h-4 bg-[#1a1918]"></div>
      <header className="flex justify-between items-center w-full h-[56px] px-5 border-b border-transparent relative sticky top-4 z-40">
        <button
          type="button"
          className="text-lg font-bold text-white px-4 py-2 rounded transition duration-200 flex items-center justify-center"
          onClick={() => navigate('/CharacterChat')}
          aria-label="홈으로 이동"
        >
          <i className="fas fa-home fa-lg"></i>
        </button>
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
      <div className="w-full max-w-[1280px] mx-auto p-4">
        <div className="flex gap-6">
          <CharacterChatSidebar
            rooms={myRooms}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onSelectRoom={handleRoomClick}
          />
          <div className="flex-1 w-0 relative">
            <div className="w-full flex flex-col pb-[120px]">
              <div className="flex items-center mb-6 p-4 bg-[#2a2928] rounded-lg">
                <img
                  src={character?.image || '/images/default-character.png'}
                  alt={character?.characterName}
                  className="w-12 h-12 rounded-full object-cover mr-4 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handleCharacterClick(character)}
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{character?.characterName}</h2>
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
                    {character?.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {messages.map((message, idx) => {
                  // 인사말 메시지(첫 메시지)는 분리 없이 하나의 박스로 출력
                  if (idx === 0 && message.id === -1 && message.sender === 'character') {
                    return (
                      <div key="greeting" className="mb-6 flex justify-start">
                        <div className="flex flex-col items-start">
                          <div className="flex items-center mb-1">
                            <img
                              src={character?.image || '/images/default-character.png'}
                              alt={character?.characterName}
                              className="w-8 h-8 rounded-full object-cover mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleCharacterClick(character)}
                            />
                            <span className="text-white text-sm font-medium">{character?.characterName}</span>
                          </div>
                          {/* 인사말은 블록 분리 없이 전체를 하나의 박스로 출력 */}
                          <div
                            className="p-3 rounded-lg max-w-[100%] bg-[#3f3f3f] text-white border-l-4 border-blue-400 ml-0 mb-4"
                          >
                            <MarkdownRenderer content={message.content} />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 일반 메시지
                  const isLatestUser = message.sender === 'user' && message.index === latestIndex;
                  const isLatestCharacterInEdit = editMode && message.sender === 'character' && message.index === latestIndex;

                  // 블록 분리
                  const blocks = splitMessageBlocks(
                    isLatestUser && editMode
                      ? editMessage
                      : message.content
                  );

                  const boxClass =
                    message.sender === 'user'
                      ? 'relative p-4 rounded-lg bg-[#3b7cc9] text-white group-hover:bg-[#2d62a0] transition max-w-[70%]'
                      : 'relative p-4 rounded-lg bg-[#2e2d2c] text-white group-hover:bg-[#3a3938] transition max-w-[100%] ml-0';

                  return (
                    <div
                      key={message.id}
                      className={`relative mb-4 flex ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      } group`}
                    >
                      {message.sender === 'character' && (
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center mb-1">
                            <img
                              src={character?.image || '/images/default-character.png'}
                              alt={character?.characterName}
                              className="w-8 h-8 rounded-full object-cover mr-2 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleCharacterClick(character)}
                            />
                            <span className="text-white text-sm font-medium">{character?.characterName}</span>
                          </div>
                          {/* " ", ![]() 단위로 분리, 나머지는 하나의 normal 박스 */}
                          {blocks.map((block, blockIdx) => {
                            if (block.type === 'quote') {
                              return (
                                <div
                                  key={blockIdx}
                                  className="flex items-center"
                                  style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                                >
                                  <div className="p-4 rounded-lg bg-[#232f4b] text-white max-w-[100%]">
                                    <MarkdownRenderer content={block.value} />
                                  </div>
                                </div>
                              );
                            }
                            if (block.type === 'image') {
                              return (
                                <div
                                  key={blockIdx}
                                  className="p-4 rounded-lg bg-[#232323] text-white max-w-[100%] ml-0"
                                  style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                                >
                                  <MarkdownRenderer content={block.value} />
                                </div>
                              );
                            }
                            // normal: 여러 개면 하나로 합쳐져서 나옴
                            return (
                              <div
                                key={blockIdx}
                                className={boxClass}
                                style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                              >
                                {isLatestCharacterInEdit ? (
                                  <div className="animate-pulse text-gray-400 italic">수정 중...</div>
                                ) : (
                                  <MarkdownRenderer content={block.value} />
                                )}
                              </div>
                            );
                          })}
                          <div className="flex items-center text-xs mt-1 text-gray-400">
                            <span>
                              {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                            {message.index !== undefined && (
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
                          </div>
                        </div>
                      )}
                      
                      {message.sender === 'user' && (
                        <div className="flex flex-col items-end w-full">
                          <div className="flex items-center mb-1 justify-end">
                            {/* 유저 메시지에는 프로필 등 생략 */}
                          </div>
                          {blocks.map((block, blockIdx) => {
                            if (block.type === 'quote') {
                              return (
                                <div
                                  key={blockIdx}
                                  className="flex items-center justify-end"
                                  style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                                >
                                  <div className="p-4 rounded-lg bg-[#232f4b] text-white max-w-[70%]">
                                    <MarkdownRenderer content={block.value} />
                                  </div>
                                </div>
                              );
                            }
                            if (block.type === 'image') {
                              return (
                                <div
                                  key={blockIdx}
                                  className="p-4 rounded-lg bg-[#232323] text-white max-w-[70%]"
                                  style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                                >
                                  <MarkdownRenderer content={block.value} />
                                </div>
                              );
                            }
                            // normal: 여러 개면 하나로 합쳐져서 나옴
                            return (
                              <div
                                key={blockIdx}
                                className={boxClass}
                                style={{ marginTop: blockIdx === 0 ? 0 : '24px' }}
                              >
                                {isLatestUser && editMode ? (
                                  <div className="animate-pulse">
                                    <MarkdownRenderer content={block.value} />
                                  </div>
                                ) : (
                                  <MarkdownRenderer content={block.value} />
                                )}
                              </div>
                            );
                          })}
                          <div className="flex items-center text-xs mt-1 text-blue-200 justify-end">
                            <span>
                              {message.timestamp && new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                            {isLatestUser && !editMode && (
                              <button
                                className="ml-2 text-xs text-blue-200 hover:text-blue-100 active:text-blue-50 bg-transparent flex items-center gap-1 transition-colors"
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
                      )}
                    </div>
                  );
                })}
                
                {isSending && (
                  <div className="mb-4 flex justify-start">
                    <div className="p-3 rounded-lg max-w-[70%] bg-[#3f3f3f] text-white opacity-80">
                      <span className="animate-pulse">답변 생성 중...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            {/* 하단 입력창 */}
            <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[1280px] z-50 bg-[#232323] border-t border-[#353535] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center w-full gap-2">
                {/* 모델 선택 드롭다운 - 너비를 120px로 변경 */}
                <select
                  aria-label="Select AI model"
                  className="w-[120px] p-3 rounded-lg bg-[#3f3f3f] text-white border-none focus:outline-none flex-shrink-0"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isSending}
                >
                  <option value="Llama">Free</option>
                  {membership === 'VIP' && (
                    <>
                      <option value="gpt4.1_mini">GPT</option>
                      <option value="gpt4.1">GPT+</option>
                      <option value="Venice/venice_mistral">Venice</option>
                      <option value="Venice/venice_uncensored">Venice+</option>
                    </>
                  )}
                </select>

                {/* 입력창: 수정모드면 editMessage, 아니면 newMessage - onKeyDown 추가 */}
                <textarea
                  value={editMode ? editMessage : newMessage}
                  onChange={(e) =>
                    editMode
                      ? setEditMessage(e.target.value)
                      : setNewMessage(e.target.value)
                  }
                  onKeyDown={handleKeyDown} // 키보드 이벤트 핸들러 추가
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                  }}
                  placeholder={isMobile ? "메시지를 입력하세요..." : "메시지 입력 (Shift+Enter: 줄바꿈, Enter: 전송)"}
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
                    disabled={isSending}
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
      {/* 캐릭터 상세 모달 - CharacterChat.tsx와 동일하게 selectedCharacter로 제어 */}
      {characterDetail && (
        <CharacterDetailModal
          character={characterDetail}
          onClose={() => setCharacterDetail(null)}
          onChat={handleChat}
        />
      )}
    </div>
  );
};

export default CharacterChatRoom;
