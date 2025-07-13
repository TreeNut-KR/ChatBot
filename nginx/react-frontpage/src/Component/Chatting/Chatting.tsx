import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import ChatHeader from './Components/ChatHeader';
import VirtualizedChatContainer from './Components/VirtualizedChatContainer';
import ChatFooter from './Components/ChatFooter';
import ChatSidebar from './Components/ChatSidebar';
import Toast from './Components/Toast';
import { Message, ChatRoom, ToastMessage, ChattingProps } from './Types';
import { 
  fetchChatRooms, 
  deleteChatRoom as apiDeleteChatRoom, 
  createNewChatRoom,
  getChatResponse,
  loadChatLogs as apiLoadChatLogs
} from './Services/api';
import { setCookie, getCookie, removeCookie } from '../../Cookies';
import { motion, AnimatePresence } from 'framer-motion';

const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

const Chatting: React.FC<ChattingProps> = ({ messages, setMessages, onSend }) => {
  // 상태 관리
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState(false);
  const [model, setModel] = useState('gpt4o.1');
  const [googleAccess, setGoogleAccess] = useState('Y');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [layoutRefreshKey, setLayoutRefreshKey] = useState(0);

  // Ref
  const modelRef = useRef(model);
  const animationStateRef = useRef({
    isPageLoad: true,
    animationCompleted: false,
    isInitialized: false,
    initStarted: false
  });

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // Toast 관련 함수
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // 레이아웃 새로고침 함수
  const forceLayoutRefresh = useCallback(() => {
    setLayoutRefreshKey(prev => prev + 1);
    console.log('🔄 레이아웃 강제 새로고침');
  }, []);

  // 메시지 ID 생성 함수
  const generateMessageId = useCallback((type: string, timestamp?: number) => {
    const ts = timestamp || Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}_${ts}_${random}`;
  }, []);

  // 메시지 정렬 함수
  const sortMessagesByTime = useCallback((messagesToSort: Message[]) => {
    return [...messagesToSort].sort((a, b) => {
      const getTimestamp = (id: string) => {
        if (!id) return 0;
        const parts = id.split('_');
        if (parts.length >= 2) {
          const timestamp = parseInt(parts[1]);
          return isNaN(timestamp) ? 0 : timestamp;
        }
        return 0;
      };

      const aTime = getTimestamp(a.id || '');
      const bTime = getTimestamp(b.id || '');

      if (aTime === bTime) {
        return (a.id || '').localeCompare(b.id || '');
      }

      return aTime - bTime;
    });
  }, []);

  // 채팅방 목록 로드
  const loadChatRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const rooms = await fetchChatRooms();
      setChatRooms(rooms || []);
    } catch (error) {
      setChatRooms([]);
      setToasts(prev => {
        const message = '채팅방 목록을 불러올 수 없습니다.';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'error' as const }];
      });
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // 메시지 전송 함수 (유저 메시지 항상 추가)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (userInput.trim() === '') return;

    setIsLoading(true);

    let roomId = getCookie('mongo_chatroomid') || '';
    const urlParams = new URLSearchParams(window.location.search);
    let urlRoomId = urlParams.get('roomId');

    if (!roomId || !urlRoomId) {
      try {
        const responseData = await createNewChatRoom();
        roomId = responseData.mysql_officeroom.mongo_chatroomid;
        setCookie('mongo_chatroomid', roomId);

        const pageUrl = new URL(window.location.href);
        pageUrl.searchParams.set('roomId', roomId);
        window.history.replaceState({}, document.title, pageUrl.toString());
      } catch (error) {
        setToasts(prev => {
          const message = '채팅방을 생성할 수 없습니다.';
          const isDuplicate = prev.some(toast => toast.message === message);
          if (isDuplicate) return prev;
          const id = Date.now();
          return [...prev, { id, message, type: 'error' as const }];
        });
        setIsLoading(false);
        return;
      }
    }

    const userMessageText = userInput;
    const baseTimestamp = Date.now();

    // 유저 메시지 생성
    const userMessage: Message = {
      id: generateMessageId('user', baseTimestamp),
      user: '나',
      text: userMessageText,
      className: 'bg-indigo-500 text-black',
      type: '',
      isRetroactive: false,
      retry: () => {
        handleRetrySend({
          id: generateMessageId('user_retry'),
          user: '나',
          text: userMessageText,
          className: 'bg-indigo-500 text-black',
          type: '',
        });
      },
    };

    // 유저 메시지 항상 추가
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');

    try {
      const aiResponse = await getChatResponse(roomId, userMessageText, model, googleAccess);
      const aiText = aiResponse?.text || aiResponse?.data?.text || aiResponse?.message;

      if (aiText) {
        // AI 메시지 생성
        const aiMessage: Message = {
          id: generateMessageId('ai', baseTimestamp + 1),
          user: 'AI',
          text: aiText,
          className: 'bg-gray-600 text-white',
          type: '',
          isRetroactive: false,
        };

        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (e) {
      setToasts(prev => {
        const message = '메시지 전송 중 오류가 발생했습니다.';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'error' as const }];
      });
    }
    setIsLoading(false);
  };

  // 재전송 함수
  const handleRetrySend = useCallback(async (aiMsg: Message) => {
    console.log('handleRetrySend 실행', aiMsg);

    let userMsgText = '';
    let newUserMsg;
    let loadingMsgId = `loading-${Date.now()}`;

    setMessages(prevMessages => {
      const aiIdx = prevMessages.findIndex(m => m.id === aiMsg.id);
      if (aiIdx < 1) return prevMessages;
      const userMsg = [...prevMessages].slice(0, aiIdx).reverse().find(m => m.user === "나");
      if (!userMsg) return prevMessages;

      userMsgText = userMsg.text;
      newUserMsg = { ...userMsg, id: `retry-user-${Date.now()}` };
      const loadingMsg = {
        id: loadingMsgId,
        user: "AI",
        text: "메시지 생성중...",
        className: "text-gray-400 italic animate-pulse",
        type: "",
        isIntroMessage: false,
      };
      return [...prevMessages, newUserMsg, loadingMsg];
    });

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);

    if (!userMsgText) return;
    const roomId = getCookie('mongo_chatroomid') || '';
    const aiResponse = await getChatResponse(roomId, userMsgText, model, googleAccess);
    const newAnswer = aiResponse?.text || aiResponse?.data?.text || aiResponse?.message;

    setMessages(prevMessages =>
      prevMessages.map(m =>
        m.id === loadingMsgId
          ? { ...m, text: newAnswer, className: "" }
          : m
      )
    );
  }, [setMessages, model, googleAccess]);

  // 인트로 메시지
  const INTRO_MESSAGE: Message = {
    id: 'welcome_0',
    user: '',
    className: 'self-start',
    text: '안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.',
    type: 'client',
    isIntroMessage: true,
  };

  // 채팅 로그 로드
  const loadInitialChatLogs = async (roomId: string) => {
    try {
      setIsLoading(true);
      const data = await apiLoadChatLogs(roomId);

      if (data && data.logs && data.logs.value && Array.isArray(data.logs.value)) {
        const chatMessages: Message[] = [];
        const baseTime = Date.now() - (data.logs.value.length * 2000);

        data.logs.value.forEach((log: any, index: number) => {
          const logBaseTime = baseTime + (index * 2000);

          if (log.input_data && log.input_data.trim() !== '') {
            const userMessage: Message = {
              id: generateMessageId('user_log', logBaseTime),
              user: '나',
              text: log.input_data,
              className: 'bg-indigo-500 text-black',
              type: '',
              isRetroactive: true,
              timestamp: log.timestamp, // ← 이 줄만 추가
            };
            chatMessages.push(userMessage);
          }

          if (log.output_data && log.output_data.trim() !== '') {
            const aiMessage: Message = {
              id: generateMessageId('ai_log', logBaseTime + 1000),
              user: 'AI',
              text: log.output_data,
              className: 'bg-gray-600 text-white',
              type: '',
              isRetroactive: true,
              timestamp: log.timestamp, // ← 이 줄만 추가
            };
            chatMessages.push(aiMessage);
          }
        });

        const sortedMessages = sortMessagesByTime(chatMessages);
        const hasIntro = sortedMessages.some(msg => msg.isIntroMessage);
        const finalMessages = hasIntro ? sortedMessages : [INTRO_MESSAGE, ...sortedMessages];
        setMessages(finalMessages);

        setTimeout(() => {
          forceLayoutRefresh();
          finishInitialization();
        }, 500);
      } else {
        setMessages([INTRO_MESSAGE]);
        forceLayoutRefresh();
        finishInitialization();
      }
    } catch (error) {
      setMessages([INTRO_MESSAGE]);
      forceLayoutRefresh();
      finishInitialization();
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅방 선택 핸들러
  const handleSelectRoom = useCallback(async (roomId: string) => {
    try {
      const previousRoomId = getCookie('mongo_chatroomid');
      if (previousRoomId !== roomId) {
        setCookie('mongo_chatroomid', roomId);
        const url = new URL(window.location.href);
        url.searchParams.set('roomId', roomId);
        setToasts(prev => {
          const message = '채팅방을 변경하는 중...';
          const isDuplicate = prev.some(toast => toast.message === message);
          if (isDuplicate) return prev;
          const id = Date.now();
          return [...prev, { id, message, type: 'info' as const }];
        });
        setMessages([]);
        setIsSidebarOpen(false);
        window.location.href = url.toString();
      } else {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      setToasts(prev => {
        const message = '채팅방을 변경하는 데 실패했습니다.';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'error' as const }];
      });
    }
  }, []);

  // 채팅방 삭제 핸들러
  const handleDeleteChatRoom = useCallback(async (roomId: string, title?: string) => {
    if (!roomId) return;
    try {
      setToasts(prev => {
        const message = `채팅방 "${title || '제목 없음'}" 삭제 중...`;
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'info' as const }];
      });
      setChatRooms(prev => prev.filter(room => {
        const roomIdToCompare = room.mongo_chatroomid || room.roomid || room.id || room.chatroom_id;
        return roomIdToCompare !== roomId;
      }));

      await apiDeleteChatRoom(roomId);

      const currentRoomId = getCookie('mongo_chatroomid');
      if (currentRoomId === roomId) {
        removeCookie('mongo_chatroomid');
        const rooms = await fetchChatRooms();
        if (rooms && rooms.length > 0) {
          const lastRoom = rooms[rooms.length - 1];
          const lastRoomId = lastRoom.mongo_chatroomid || lastRoom.roomid || lastRoom.id || lastRoom.chatroom_id || '';
          setCookie('mongo_chatroomid', lastRoomId);
          const pageUrl = new URL(window.location.href);
          pageUrl.searchParams.set('roomId', lastRoomId);
          window.location.href = pageUrl.toString();
        } else {
          const pageUrl = new URL(window.location.href);
          pageUrl.searchParams.delete('roomId');
          window.location.href = pageUrl.toString();
        }
      } else {
        await loadChatRooms();
        setToasts(prev => {
          const message = `채팅방 "${title || '제목 없음'}"이 삭제되었습니다.`;
          const isDuplicate = prev.some(toast => toast.message === message);
          if (isDuplicate) return prev;
          const id = Date.now();
          return [...prev, { id, message, type: 'success' as const }];
        });
      }
    } catch (error) {
      await loadChatRooms();
      setToasts(prev => {
        const message = '채팅방을 삭제하는 데 실패했습니다.';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'error' as const }];
      });
    }
  }, [loadChatRooms]);

  // 새 채팅방 생성 핸들러
  const handleCreateNewChat = useCallback(async () => {
    try {
      setIsSidebarOpen(false);
      removeCookie('mongo_chatroomid');
      setIsLoading(true);
      setToasts(prev => {
        const message = '새 채팅방을 생성하는 중...';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'info' as const }];
      });
      const responseData = await createNewChatRoom();
      const roomId = responseData.mysql_officeroom.mongo_chatroomid;
      setCookie('mongo_chatroomid', roomId);
      const pageUrl = new URL(window.location.href);
      pageUrl.searchParams.set('roomId', roomId);
      window.location.href = pageUrl.toString();
    } catch (error) {
      setToasts(prev => {
        const message = '새 채팅방을 생성할 수 없습니다.';
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'error' as const }];
      });
      setIsLoading(false);
    }
  }, []);

  // 메뉴 클릭 핸들러 - 사이드바 열기 시 채팅방 목록 로드
  const handleMenuClick = useCallback(() => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      if (newState) {
        loadChatRooms();
      }
      return newState;
    });
  }, [loadChatRooms]);

  // 초기화 함수
  const finishInitialization = () => {
    animationStateRef.current.animationCompleted = true;
    animationStateRef.current.isPageLoad = false;
    animationStateRef.current.isInitialized = true;
  };

  // 초기화 - 한 번만 실행
  useEffect(() => {
    if (animationStateRef.current.initStarted) {
      return;
    }
    animationStateRef.current.initStarted = true;
    const initializeApp = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomId = urlParams.get('roomId');
        const cookieRoomId = getCookie('mongo_chatroomid');
        await loadChatRooms();
        if (urlRoomId && cookieRoomId && urlRoomId === cookieRoomId) {
          await loadInitialChatLogs(urlRoomId);
          return;
        }
        if (cookieRoomId) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('roomId', cookieRoomId);
          window.history.replaceState({}, document.title, newUrl.toString());
          await loadInitialChatLogs(cookieRoomId);
        } else {
          const guideMessage: Message = {
            id: generateMessageId('system_guide'),
            user: '시스템',
            text: '채팅을 시작하려면 좌측 상단의 메뉴를 열고 "새 채팅방 시작" 버튼을 클릭하세요.',
            className: 'bg-indigo-600 text-white',
            type: 'info',
            isRetroactive: false,
          };
          setMessages([guideMessage]);
          forceLayoutRefresh();
          finishInitialization();
        }
      } catch (error) {
        const errorMessage: Message = {
          id: generateMessageId('system_init_error'),
          user: '시스템',
          text: '채팅 연결에 실패했습니다. 페이지를 새로고치거나 나중에 다시 시도해주세요.',
          className: 'bg-red-600 text-white',
          type: 'error',
          isRetroactive: false,
        };
        setMessages([errorMessage]);
        forceLayoutRefresh();
        finishInitialization();
      }
    };
    initializeApp();
  }, [generateMessageId, forceLayoutRefresh, loadChatRooms]);

  useEffect(() => {
    if (model && messages.length > 0 && animationStateRef.current.isInitialized) {
      setToasts(prev => {
        const message = `모델이 ${model}로 변경되었습니다.`;
        const isDuplicate = prev.some(toast => toast.message === message);
        if (isDuplicate) return prev;
        const id = Date.now();
        return [...prev, { id, message, type: 'success' as const }];
      });
      setCookie('selected_model', model);
    }
  }, [model, messages.length]);

  useEffect(() => {
    const savedModel = getCookie('selected_model');
    const savedGoogleAccess = getCookie('google_access');
    if (savedModel) setModel(savedModel);
    if (savedGoogleAccess) setGoogleAccess(savedGoogleAccess);
  }, []);

  return (
    <div
      className={[
        "flex flex-col items-center justify-center bg-gray-900 relative",
        isIOS() ? "ios-fix-viewport" : "h-[100vh]"
      ].join(" ")}
    >
      {/* 메인 사이드바 버튼 및 오버레이/aside 완전히 삭제 */}

      {/* 챗 사이드바 */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {isSidebarOpen && (
        <ChatSidebar 
          rooms={chatRooms} 
          onClose={() => setIsSidebarOpen(false)} 
          onSelectRoom={handleSelectRoom}
          onDeleteRoom={handleDeleteChatRoom}
          isLoading={isLoadingRooms}
          onCreateNewChat={handleCreateNewChat}
        />
      )}

      {/* Toast 메시지 */}
      <div className="fixed z-50 flex flex-col
        bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-xs
        sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:translate-x-0">
        <AnimatePresence>
          {toasts.map((toast, i) => (
            <motion.div 
              key={toast.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-2"
            >
              <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => removeToast(toast.id)}
                index={i}
                show={true}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {/* 메인 채팅 UI */}
      <div
        className={[
          "flex flex-col text-white w-full max-w-5xl bg-gray-900",
          isIOS() ? "h-full" : "h-full"
        ].join(" ")}
        style={isIOS() ? { minHeight: "100dvh", maxHeight: "100dvh" } : {}}
      >
        <ChatHeader 
          model={model} 
          setModel={setModel} 
          googleAccess={googleAccess} 
          setGoogleAccess={setGoogleAccess}
          onMenuClick={handleMenuClick}
        />
        
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
          <VirtualizedChatContainer
            messages={messages}
            isLoading={isLoading}
            handleRetrySend={handleRetrySend}
            layoutRefreshKey={layoutRefreshKey}
          />
          <ChatFooter
            userInput={userInput}
            setUserInput={setUserInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            scrollToBottom={() => {}}
            model={model}
            setModel={setModel}
          />
        </main>
      </div>
    </div>
  );
};

export default Chatting;