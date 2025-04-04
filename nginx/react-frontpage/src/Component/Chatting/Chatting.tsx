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
  googleAccess: string;
  setGoogleAccess: React.Dispatch<React.SetStateAction<string>>;
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

// 채팅방 정보를 위한 인터페이스 업데이트
interface ChatRoom {
  mongo_chatroomid?: string;
  roomid?: string; // API 응답 형식에 따라 추가
  title?: string; 
  Title?: string; // API가 대문자 Title을 반환하는 경우
  first_message?: string;
  created_at?: string;
}

// Toast 컴포넌트 수정 - 위치 스타일 변경
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

// ChatSidebar 컴포넌트 수정 - 안정적인 키 설정과 정렬 유지
const ChatSidebar: React.FC<{
  rooms: ChatRoom[];
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string, title?: string) => void;
  isLoading: boolean;
  onCreateNewChat: () => void;
}> = ({ rooms, onClose, onSelectRoom, onDeleteRoom, isLoading, onCreateNewChat }) => {
  
  // 현재 선택된 채팅방 ID 가져오기
  const currentRoomId = localStorage.getItem('mongo_chatroomid');
  
  // 제목 텍스트를 최대 8자로 제한하는 함수
  const truncateTitle = (title: string | undefined): string => {
    if (!title) return '제목 없음';
    return title.length > 8 ? `${title.substring(0, 8)}...` : title;
  };

  return (
    <div className="fixed top-0 right-0 h-full w-72 bg-gray-800 shadow-lg z-50 transform transition-all duration-300 ease-in-out overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">내 채팅방</h2>
        <div className="flex items-center gap-2">
          {/* 새 채팅방 생성 버튼 추가 */}
          <button 
            onClick={onCreateNewChat}
            className="text-white hover:bg-gray-600 p-1 rounded-md transition-colors"
            title="새 채팅방 생성"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          {/* 닫기 버튼 */}
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="p-4 text-gray-400 text-center">
          로딩 중...
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-4 text-gray-400 text-center">
          채팅방이 없습니다.
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {rooms.map((room) => {
            const roomId = room.mongo_chatroomid || room.roomid || '';
            const isSelected = roomId === currentRoomId;
            const roomTitle = room.Title || room.title;
            
            return (
              <div 
                key={roomId} // 각 채팅방의 고유 ID를 키로 사용
                className={`p-3 rounded-md transition-colors flex flex-col ${
                  isSelected 
                    ? 'bg-indigo-600 border border-indigo-400' 
                    : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div 
                  onClick={() => onSelectRoom(roomId)}
                  className="cursor-pointer"
                >
                  <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                    {truncateTitle(roomTitle)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {room.created_at ? new Date(room.created_at).toLocaleDateString() : ''}
                  </div>
                </div>
                
                {/* 삭제 버튼 추가 */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // 상위 요소 클릭 방지
                      if (window.confirm(`"${roomTitle || '제목 없음'}" 채팅방을 삭제하시겠습니까?`)) {
                        onDeleteRoom(roomId, roomTitle);
                      }
                    }}
                    className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                    title="채팅방 삭제"
                  >
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ChatHeader 컴포넌트 수정 - 체크박스 이벤트 핸들러 개선 및 햄버거 버튼 추가
const ChatHeader: React.FC<ChatHeaderProps & { onMenuClick: () => void }> = ({ 
  model, 
  setModel, 
  googleAccess, 
  setGoogleAccess,
  onMenuClick 
}) => (
  <div className="bg-gray-900 flex flex-col sm:flex-row items-center justify-between px-5 py-2 border-b border-gray-800 gap-2">
    <h1 className="text-lg text-white font-semibold">TreeNut ChatBot</h1>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          id="googleAccess" 
          checked={googleAccess === "true"}
          onChange={(e) => {
            console.log("체크박스 상태 변경:", e.target.checked);
            setGoogleAccess(e.target.checked ? "true" : "false");
          }}
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
        >
          <option value="Llama">Llama</option>
          <option value="gpt4o_mini">gpt4o_mini</option>
        </select>
      </div>

      {/* 햄버거 버튼 추가 */}
      <button 
        onClick={onMenuClick}
        className="text-white hover:bg-gray-700 p-2 rounded-md transition-colors"
        aria-label="채팅방 목록"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
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

// 토큰 가져오기 및 형식 처리 함수
const getAuthHeader = () => {
  const token = localStorage.getItem('jwt-token');
  if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

  // Bearer 접두사가 이미 있는지 확인하고 제거
  const tokenValue = token.startsWith('Bearer ') 
    ? token.substring(7) // 'Bearer ' 접두사 제거
    : token;
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${tokenValue}`
  };
};

const Chatting: React.FC<ChattingProps> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>('Llama');
  const [googleAccess, setGoogleAccess] = useState<string>("true"); // 문자열로 유지
  const chatContainerRef = useRef<HTMLDivElement>(null!);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 채팅방 삭제 함수 수정 - 올바른 API 엔드포인트 사용
  const deleteChatRoom = async (roomId: string, title?: string) => {
    try {
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      // 삭제 전에 먼저 UI 변경 - 사용자에게 피드백 제공
      showToast(`채팅방 "${title || '제목 없음'}" 삭제 중...`, 'info');

      // API 엔드포인트 사용
      const url = `https://treenut.ddns.net/server/chatroom/office/${roomId}/delete_room`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('채팅방 삭제에 실패했습니다.');
      }

      // 현재 보고 있는 채팅방을 삭제한 경우
      const currentRoomId = localStorage.getItem('mongo_chatroomid');
      if (currentRoomId === roomId) {
        // 로컬스토리지의 채팅방 ID 제거
        localStorage.removeItem('mongo_chatroomid');
        
        // 새 채팅방 생성으로 리디렉션 또는 홈으로 이동
        showToast('현재 채팅방이 삭제되었습니다. 새 채팅방을 생성합니다...', 'info');
        
        // 페이지 새로고침 (현재 채팅방 삭제 후 새로운 세션 시작)
        window.location.reload();
      } else {
        // 다른 채팅방을 삭제한 경우 채팅방 목록만 갱신
        await fetchChatRooms(); // await로 목록 갱신 완료 대기
        showToast(`채팅방 "${title || '제목 없음'}"이 삭제되었습니다.`, 'success');
      }
    } catch (error) {
      console.error('채팅방 삭제 오류:', error);
      showToast('채팅방을 삭제하는 데 실패했습니다.', 'error');
    }
  };

  // 햄버거 메뉴 클릭 핸들러 수정 - 목록 갱신 속도 개선
  const handleMenuClick = async () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);  // 먼저 사이드바 열기
      await fetchChatRooms();  // 채팅방 목록 가져오기
    } else {
      setIsSidebarOpen(false);
    }
  };

  // 채팅방 목록 가져오기 함수 수정 - 에러 처리 개선
  const fetchChatRooms = async () => {
    try {
      setIsLoadingRooms(true);
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      const url = "https://treenut.ddns.net/server/chatroom/office/find_my_rooms";

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('채팅방 목록을 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      console.log('채팅방 목록:', data);
      
      // API 응답 형식에 따라 적절히 구조화
      if (Array.isArray(data)) {
        // 기존 순서 유지를 위해 ID를 기준으로 정렬
        setChatRooms(data);
      } else if (data.rooms && Array.isArray(data.rooms)) {
        setChatRooms(data.rooms);
      } else {
        console.error('예상치 못한 API 응답 형식:', data);
        setChatRooms([]);
      }
    } catch (error) {
      console.error('채팅방 목록 불러오기 오류:', error);
      showToast('채팅방 목록을 불러올 수 없습니다.', 'error');
      setChatRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // 새 채팅방 생성 핸들러 수정 - 삭제 후 새로운 채팅 흐름 개선
  const handleCreateNewChat = async () => {
    try {
      // 사이드바 닫기
      setIsSidebarOpen(false);
      
      // 기존 채팅방 ID 초기화
      localStorage.removeItem('mongo_chatroomid');
      
      // 로딩 상태 표시
      setIsLoading(true);
      showToast('새 채팅방을 생성하는 중...', 'info');
      
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      // JWT 토큰 형식 확인 및 수정
      const tokenValue = token.startsWith('Bearer ') 
        ? token.substring(7) // 'Bearer ' 접두사 제거
        : token;
      
      const url = new URL("https://treenut.ddns.net/server/chatroom/office");

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenValue}`,  // 형식에 맞게 Bearer 접두사 추가
        },
      });

      if (!response.ok) {
        throw new Error('서버 요청 실패');
      }

      const responseData = await response.json();
      const roomId = responseData.mysql_officeroom.mongo_chatroomid;
      
      // 새 채팅방 ID 저장
      localStorage.setItem('mongo_chatroomid', roomId);
      
      // URL에 채팅방 ID 추가하고 페이지 새로고침
      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.set('roomId', roomId);
      
      // 페이지 새로고침 (URL 변경과 함께)
      window.location.href = pageUrl.toString();
    } catch (error) {
      console.error('새 채팅방 생성 오류:', error);
      showToast('새 채팅방을 생성할 수 없습니다.', 'error');
      
      // 오류 메시지 표시
      appendMessage({
        user: '시스템',
        text: '새 채팅방을 생성하는 데 실패했습니다. 다시 시도해주세요.',
        className: 'bg-red-600 text-white',
        type: 'error',
      });
      setIsLoading(false);
    }
  };

  // 채팅방 선택 핸들러 개선
  const handleSelectRoom = async (roomId: string) => {
    try {
      // 이전 선택된 채팅방 ID 저장
      const previousRoomId = localStorage.getItem('mongo_chatroomid');
      
      // 다른 방을 선택한 경우에만 처리
      if (previousRoomId !== roomId) {
        // 새로 선택한 채팅방 ID 저장
        localStorage.setItem('mongo_chatroomid', roomId);
        
        // URL에 채팅방 ID 추가하고 페이지 새로고침
        const url = new URL(window.location.href);
        url.searchParams.set('roomId', roomId);
        
        // 채팅방 변경 표시
        showToast('채팅방을 변경하는 중...', 'info');
        
        // 페이지 새로고침 (URL 변경과 함께)
        window.location.href = url.toString();
      } else {
        // 같은 방 선택 시 사이드바만 닫기
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('채팅방 변경 오류:', error);
      showToast('채팅방을 변경하는 데 실패했습니다.', 'error');
      
      // 오류 메시지 표시
      appendMessage({
        user: '시스템',
        text: '채팅방을 변경하는 데 실패했습니다. 다시 시도해주세요.',
        className: 'bg-red-600 text-white',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        // URL에서 roomId 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomId = urlParams.get('roomId');
        
        // URL에 roomId가 있으면 localStorage에 저장
        if (urlRoomId) {
          console.log('💬 URL에서 채팅방 ID 감지:', urlRoomId);
          localStorage.setItem('mongo_chatroomid', urlRoomId);
          
          // URL에서 roomId 파라미터 제거 (히스토리 관리를 위해)
          if (window.history.replaceState) {
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('roomId');
            window.history.replaceState({}, document.title, cleanUrl.toString());
          }
        }
        
        // 로컬 스토리지에서 채팅방 ID 가져오기
        const roomId = localStorage.getItem('mongo_chatroomid');
        
        // 계정 ID 확인 (계정 식별자로 사용)
        const currentUserId = localStorage.getItem('user_id');
        const previousUserId = localStorage.getItem('previous_user_id');
        
        console.log('💬 세션 초기화 - 채팅방 ID:', roomId, '메시지 수:', messages.length);
        
        // 채팅방 ID가 있을 때
        if (roomId) {
          try {
            console.log('💬 채팅방 ID가 있음, 채팅 로그 로딩 시도');
            await loadChatLogs(roomId);
          } catch (loadError) {
            console.error('💬 채팅 로그 로드 실패:', loadError);
            // 로드 실패 시 새 채팅방 생성 시도
            localStorage.removeItem('mongo_chatroomid');
            await getFromServer(model);
          }
        } 
        // 채팅방 ID가 없거나 사용자가 변경된 경우
        else if (!roomId || (currentUserId && currentUserId !== previousUserId)) {
          console.log('💬 새 채팅방 생성 필요');
          // 사용자 변경된 경우 이전 채팅방 정보 초기화
          if (currentUserId && currentUserId !== previousUserId) {
            localStorage.removeItem('mongo_chatroomid');
            localStorage.setItem('previous_user_id', currentUserId);
          }
          
          // 새 채팅방 생성
          await getFromServer(model);
        }
      } catch (error) {
        console.error('채팅 세션 초기화 실패:', error);
        showToast('채팅 세션 초기화에 실패했습니다.', 'error');
        
        // 세션 초기화 실패 시 사용자에게 오류 메시지 표시
        appendMessage({
          user: '시스템',
          text: '채팅 연결에 실패했습니다. 페이지를 새로고침하거나 나중에 다시 시도해주세요.',
          className: 'bg-red-600 text-white',
          type: 'error',
        });
      }
    };
    
    initializeChatSession();
  }, [model]);

  useEffect(() => {
    if (model && messages.length > 0) {
      // 서버 메시지 대신 토스트 메시지만 표시
      showToast(`모델이 ${model}로 변경되었습니다.`, 'success');
    }
  }, [model]); // model이 변경될 때만 실행

  // Google 접근 설정 변경 시 알림 추가
  useEffect(() => {
    if (messages.length > 0) {
      // 서버 메시지 대신 토스트 메시지만 표시
      showToast(`Google 접근이 ${googleAccess === "true" ? '활성화' : '비활성화'}되었습니다.`, 'info');
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

  // getFromServer 함수 수정
const getFromServer = async (model: string, inputText?: string) => {
  try {
    const token = localStorage.getItem('jwt-token');
    if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

    // JWT 토큰 형식 확인 및 수정
    // 1. 현재 token 형식 확인
    console.log('현재 토큰 형식:', token.substring(0, 20) + '...');
    
    // 2. 'Bearer ' 접두사가 이미 있는지 확인하고 제거
    const tokenValue = token.startsWith('Bearer ') 
      ? token.substring(7) // 'Bearer ' 접두사 제거
      : token;
    
    const url = new URL("https://treenut.ddns.net/server/chatroom/office");

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getAuthHeader(),
    });

    // 나머지 코드는 동일
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

      const url = `https://treenut.ddns.net/server/chatroom/office/${roomId}/get_response`;
      
      // 서버로 전송할 body 객체 생성
      const requestBody = {
        input_data_set: inputText,
        route_set: model, // 선택된 모델로 route_set 설정
        google_access_set: googleAccess, // 이미 문자열이므로 변환 불필요
      };
      
      // 요청 body 콘솔에 출력
      console.log('서버로 전송하는 데이터:', requestBody);

      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(requestBody),
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

  // 채팅 로그 로드 함수 개선
  const loadChatLogs = async (roomId: string) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('jwt-token');
      if (!token) throw new Error('JWT 토큰이 없습니다. 로그인 해주세요.');

      const url = `https://treenut.ddns.net/server/chatroom/office/${roomId}/load_logs`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`채팅 로그를 불러오는데 실패했습니다. (상태 코드: ${response.status})`);
      }

      const data = await response.json();
      console.log('채팅 로그 데이터:', data);
      
      // 메시지 초기화
      onSend({ type: 'clear_messages', user: '', text: '', className: '' });
      
      // 로그 데이터 확인 및 처리
      if (data && data.status === 200 && data.logs) {
        // 로그 배열 처리 (형식에 따라 다르게 처리)
        const logsArray = data.logs.value || [];
        
        if (Array.isArray(logsArray) && logsArray.length > 0) {
          console.log(`💬 ${logsArray.length}개의 메시지 로드됨`);
          
          // logsArray를 시간순으로 정렬 (timestamp가 있다면)
          const sortedLogs = [...logsArray].sort((a, b) => {
            if (a.timestamp && b.timestamp) {
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            }
            return a.index - b.index; // timestamp가 없으면 index로 정렬
          });
          
          // 정렬된 로그를 순차적으로 메시지로 변환
          sortedLogs.forEach((log) => {
            // 사용자 메시지 추가
            if (log.input_data) {
              appendMessage({
                user: '나',
                text: log.input_data,
                className: 'bg-indigo-500 text-white',
                type: '',
              });
            }
            
            // AI 응답 메시지 추가
            if (log.output_data) {
              appendMessage({
                user: 'AI',
                text: log.output_data,
                className: 'bg-gray-600 text-white',
                type: '',
              });
            }
          });
          
          showToast(`${logsArray.length}개의 메시지를 불러왔습니다.`, 'success');
        } else {
          console.log('💬 이전 대화 내역 없음 또는 빈 배열');
          showToast('이전 대화 내역이 없습니다.', 'info');
          
          // 빈 채팅방인 경우 환영 메시지 표시 (선택적)
          appendMessage({
            user: 'AI',
            text: '안녕하세요! 이 채팅방에서 새로운 대화를 시작해보세요.',
            className: 'bg-gray-600 text-white',
            type: '',
          });
        }
      } else {
        console.error('잘못된 응답 형식:', data);
        throw new Error('채팅 로그 데이터 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('채팅 로그 불러오기 오류:', error);
      showToast('채팅 내역을 불러올 수 없습니다.', 'error');
      
      // 오류 메시지 표시
      appendMessage({ 
        user: '시스템', 
        text: '채팅 내역을 불러오는데 실패했습니다. 다시 시도해주세요.',
        className: 'bg-red-600 text-white', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-[100vh] bg-gray-900 relative">
      {/* 사이드바 추가 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      
      {isSidebarOpen && (
        <ChatSidebar 
          rooms={chatRooms} 
          onClose={() => setIsSidebarOpen(false)} 
          onSelectRoom={handleSelectRoom}
          onDeleteRoom={deleteChatRoom} // 삭제 핸들러 추가
          isLoading={isLoadingRooms}
          onCreateNewChat={handleCreateNewChat}
        />
      )}

      {/* Toast 컨테이너 - 중앙 상단으로 위치 변경 */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 flex flex-col space-y-2 z-50">
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
          onMenuClick={handleMenuClick} // 햄버거 버튼 클릭 핸들러 추가
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
