import React, { useState, FormEvent, useEffect, useRef } from 'react';
import "./Chatting.css";
import ChatHeader from './Components/ChatHeader';
import ChatContainer from './Components/ChatContainer';
import ChatFooter from './Components/ChatFooter';
import ChatSidebar from './Components/ChatSidebar';
import Toast from './Components/Toast';
import { Message, ToastMessage, ChatRoom } from './Types';
import { 
  fetchChatRooms, 
  deleteChatRoom as apiDeleteChatRoom, 
  createNewChatRoom,
  getChatResponse,
  loadChatLogs as apiLoadChatLogs
} from './Services/api';
import { processLogMessage } from './Utils/messageUtils';
import { setCookie, getCookie, removeCookie } from '../../Cookies';

interface ChattingProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSend: (message: Message) => void;
}

const Chatting: React.FC<ChattingProps> = ({ messages, setMessages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>('Llama');
  const [googleAccess, setGoogleAccess] = useState<string>("false");
  const chatContainerRef = useRef<HTMLDivElement>(null!);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast 관련 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  useEffect(() => {
    if (toasts.length === 0) return;
    const handleUserInteraction = () => setToasts([]);
    window.addEventListener('mousedown', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);
    return () => {
      window.removeEventListener('mousedown', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [toasts.length]);

  // 메시지 추가
  const appendMessage = (message: Message) => {
    if (typeof message.className === 'undefined') message.className = '';
    if (message.type === undefined) message.type = '';
    setMessages(prev => [...prev, message]);
  };

  // 재전송 함수
  const handleRetrySend = async (message: Message) => {
  // 1. 기존 메시지(유저+AI) 삭제
  setMessages((prev) => {
    const idx = prev.findIndex(
      (m) => m.user === message.user && m.text === message.text && m.className === message.className
    );
    if (idx === -1) return prev;
    let newMessages = [...prev];
    newMessages.splice(idx, 1);
    if (newMessages[idx] && newMessages[idx].user !== message.user) {
      newMessages.splice(idx, 1);
    }
    return newMessages;
  });

  setIsLoading(true);

  // 2. 유저 메시지 추가
  appendMessage({ ...message, retry: false });

  // 3. AI 응답 받아서 추가
  const roomId = getCookie('mongo_chatroomid') || '';
  try {
    const aiResponse = await getChatResponse(roomId, message.text, model, googleAccess);
    const aiText = aiResponse?.text || aiResponse?.data?.text || aiResponse?.message;
    if (aiText) {
      appendMessage({
        user: 'AI',
        text: aiText,
        className: 'bg-gray-600 text-white',
        type: '',
      });
    }
  } catch (e) {
    showToast('메시지 재전송 중 오류가 발생했습니다.', 'error');
  }
  setIsLoading(false);
};

  // 메시지 전송
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (userInput.trim() === '') return;

    // 1. 유저 메시지 추가
    appendMessage({
      user: '나',
      text: userInput,
      className: 'bg-indigo-500 text-black',
      type: '',
      retry: false,
    });

    setUserInput('');
    setIsLoading(true);

    // 2. 서버에 메시지 전송 및 AI 응답 추가
    const roomId = getCookie('mongo_chatroomid') || '';
    try {
      const aiResponse = await getChatResponse(roomId, userInput, model, googleAccess);
      const aiText = aiResponse?.text || aiResponse?.data?.text || aiResponse?.message;
      if (aiText) {
        appendMessage({
          user: 'AI',
          text: aiText,
          className: 'bg-gray-600 text-white',
          type: '',
        });
      }
    } catch (e) {
      showToast('메시지 전송 중 오류가 발생했습니다.', 'error');
    }
    setIsLoading(false);
  };

  // handleDeleteChatRoom 함수 수정 - 자동 방생성 제거
  const handleDeleteChatRoom = async (roomId: string, title?: string) => {
    if (!roomId) {
      console.error('삭제 실패: 채팅방 ID가 없습니다');
      showToast('채팅방 ID가 없어 삭제할 수 없습니다', 'error');
      return;
    }
  
    try {
      // 디버깅 로그 추가
      console.log(`채팅방 삭제 시도: ID=${roomId}, 제목="${title || '제목 없음'}", 타입=${typeof roomId}`);
      
      // 삭제 전에 먼저 UI 변경 - 사용자에게 피드백 제공
      showToast(`채팅방 "${title || '제목 없음'}" 삭제 중...`, 'info');
  
      // 삭제 요청 전에 UI에서 먼저 제거
      setChatRooms(prev => prev.filter(room => {
        // 모든 가능한 ID 필드를 확인하여 비교
        const roomIdToCompare = room.mongo_chatroomid || room.roomid || room.id || room.chatroom_id;
        return roomIdToCompare !== roomId;
      }));
  
      // API 호출로 채팅방 삭제 - URL 인코딩 추가
      await apiDeleteChatRoom(roomId);
      console.log(`채팅방 삭제 성공: ${roomId}`);
  
      // 현재 보고 있는 채팅방을 삭제한 경우
      const currentRoomId = getCookie('mongo_chatroomid');
      if (currentRoomId === roomId) {
        console.log('현재 보고 있는 채팅방 삭제됨, 쿠키 제거');
        // 쿠키에서 채팅방 ID 제거
        removeCookie('mongo_chatroomid');
        
        // 새 채팅방 생성 대신 안내 메시지
        showToast('현재 채팅방이 삭제되었습니다. 새 채팅방을 생성해주세요.', 'info');
        
        // 페이지 새로고침
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } else {
        // 다른 채팅방을 삭제한 경우 채팅방 목록만 갱신
        console.log('다른 채팅방 삭제됨, 목록 갱신');
        
        // 약간의 지연 후 API에서 최신 목록 다시 가져오기
        setTimeout(async () => {
          await fetchChatRoomList();
        }, 300);
        
        showToast(`채팅방 "${title || '제목 없음'}"이 삭제되었습니다.`, 'success');
      }
    } catch (error) {
      console.error('채팅방 삭제 오류:', error);
      showToast('채팅방을 삭제하는 데 실패했습니다.', 'error');
      
      // 삭제 실패 시 목록 다시 가져오기
      await fetchChatRoomList();
    }
  };

  // 햄버거 메뉴 클릭 핸들러 수정 - 목록 갱신 속도 개선
  const handleMenuClick = async () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);  // 먼저 사이드바 열기
      await fetchChatRoomList();  // 채팅방 목록 가져오기
    } else {
      setIsSidebarOpen(false);
    }
  };

  // 채팅방 목록 가져오기 함수 수정 - 에러 처리 개선
  const fetchChatRoomList = async () => {
    try {
      setIsLoadingRooms(true);
      
      const rooms = await fetchChatRooms();
      
      // fetchChatRooms에서 이미 정렬된 배열을 반환하므로 바로 설정
      setChatRooms(rooms);
    } catch (error) {
      console.error('채팅방 목록 불러오기 오류:', error);
      showToast('채팅방 목록을 불러올 수 없습니다.', 'error');
      setChatRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // 새 채팅방 생성 핸들러 수정 - localStorage 대신 쿠키 사용
  const handleCreateNewChat = async () => {
    try {
      // 사이드바 닫기
      setIsSidebarOpen(false);
      
      // 기존 채팅방 ID 초기화
      removeCookie('mongo_chatroomid');
      
      // 로딩 상태 표시
      setIsLoading(true);
      showToast('새 채팅방을 생성하는 중...', 'info');
      
      const responseData = await createNewChatRoom();
      const roomId = responseData.mysql_officeroom.mongo_chatroomid;
      
      // 새 채팅방 ID 저장 (쿠키)
      setCookie('mongo_chatroomid', roomId);
      
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
      } as Message);
      setIsLoading(false);
    }
  };

  // 채팅방 선택 핸들러 개선 - localStorage 대신 쿠키 사용
  const handleSelectRoom = async (roomId: string) => {
    try {
      // 이전 선택된 채팅방 ID 저장
      const previousRoomId = getCookie('mongo_chatroomid');
      
      // 다른 방을 선택한 경우에만 처리
      if (previousRoomId !== roomId) {
        // 새로 선택한 채팅방 ID 저장 (쿠키)
        setCookie('mongo_chatroomid', roomId);
        
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
      } as Message);
    }
  };

  // useEffect 내 initializeChatSession 함수 수정
  useEffect(() => {
    const initializeChatSession = async () => {
      try {
        // URL에서 roomId 파라미터 확인
        const urlParams = new URLSearchParams(window.location.search);
        const urlRoomId = urlParams.get('roomId');
        
        // 쿠키에서 채팅방 ID와 사용자 정보 가져오기
        const cookieRoomId = getCookie('mongo_chatroomid');
        const userId = getCookie('user_id');
        const username = getCookie('username');
        
        console.log('💬 세션 초기화 - URL 채팅방 ID:', urlRoomId, '쿠키 채팅방 ID:', cookieRoomId);
        console.log('💬 사용자 정보 - ID:', userId, ', 이름:', username);
        
        // URL에 roomId가 있으면 해당 roomId 사용
        if (urlRoomId) {
          console.log('💬 URL에서 채팅방 ID 감지:', urlRoomId);
          setCookie('mongo_chatroomid', urlRoomId);
          
          // 채팅 로그 로드 - URL에 방 ID가 있을 때도 로드 추가
          await loadChatLogs(urlRoomId, true); // 최초 진입
        } 
        // URL에 roomId가 없고 쿠키에 있는 경우
        else if (cookieRoomId) {
          console.log('💬 쿠키에서 채팅방 ID 감지, 최신 방 확인:', cookieRoomId);
          try {
            const rooms = await fetchChatRooms();
            
            if (rooms && rooms.length > 0) {
              // 최신 채팅방 선택 (서버에서 이미 정렬된 상태로 옴)
              const latestRoom = rooms[0];
              const latestRoomId = latestRoom.mongo_chatroomid || latestRoom.roomid || latestRoom.id || latestRoom.chatroom_id;
              
              console.log('💬 최신 채팅방 ID:', latestRoomId);
              
              // 최신 채팅방 ID로 쿠키 업데이트
              if (latestRoomId) {
                setCookie('mongo_chatroomid', latestRoomId);
                
                // URL 업데이트 (페이지 새로고침 없이)
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('roomId', latestRoomId);
                window.history.replaceState({}, document.title, newUrl.toString());
                
                // 채팅 로그 로드
                await loadChatLogs(latestRoomId, true); // 최초 진입만 true
                return; // 함수 종료
              }
            }
            
            // 최신 방이 없거나 찾지 못한 경우 기존 쿠키의 방 사용
            console.log('💬 기존 채팅방 ID 사용:', cookieRoomId);
            
            // URL 업데이트 (페이지 새로고침 없이)
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set('roomId', cookieRoomId);
            window.history.replaceState({}, document.title, newUrl.toString());
            
            // 기존 채팅방의 로그 로드 - 이 부분이 누락되어 있었음
            await loadChatLogs(cookieRoomId, true); // 최초 진입만 true
          } catch (error) {
            console.error('💬 채팅방 목록 불러오기 오류:', error);
            showToast('채팅방 목록을 불러올 수 없습니다.', 'error');
            
            // 오류가 발생해도 기존 채팅방 로그 로드 시도
            if (cookieRoomId) {
              console.log('💬 오류 발생, 기존 채팅방 로그 로드 시도:', cookieRoomId);
              
              // URL 업데이트 (페이지 새로고침 없이)
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.set('roomId', cookieRoomId);
              window.history.replaceState({}, document.title, newUrl.toString());
              
              await loadChatLogs(cookieRoomId, true); // 최초 진입만 true
            }
          }
        } else {
          // 채팅방 ID가 없는 경우 - 자동 생성하지 않고 메시지만 표시
          console.log('💬 채팅방 ID가 없습니다. 채팅을 시작하려면 새 채팅방을 생성하세요.');
          
          // 안내 메시지 표시
          appendMessage({
            user: '시스템',
            text: '채팅을 시작하려면 좌측 상단의 메뉴를 열고 "새 채팅방 시작" 버튼을 클릭하세요.',
            className: 'bg-indigo-600 text-white',
            type: 'info',
          } as Message);
          
          // 사이드바 열기 제안 토스트 표시
          showToast('새 채팅방을 생성하려면 메뉴를 열어주세요', 'info');
        }
      } catch (error) {
        console.error('채팅 세션 초기화 실패:', error);
        showToast('채팅 세션 초기화에 실패했습니다.', 'error');
        
        // 세션 초기화 실패 시 사용자에게 오류 메시지 표시
        appendMessage({
          user: '시스템',
          text: '채팅 연결에 실패했습니다. 페이지를 새로고치거나 나중에 다시 시도해주세요.',
          className: 'bg-red-600 text-white',
          type: 'error',
        } as Message);
      }
    };
    
    initializeChatSession();
  }, [model]);

  useEffect(() => {
    if (model && messages.length > 0) {
      // 서버 메시지 대신 토스트 메시지만 표시
      showToast(`모델이 ${model}로 변경되었습니다.`, 'success');
      // 선택한 모델 쿠키로 저장 (선택 사항)
      setCookie('selected_model', model);
    }
  }, [model]); // model이 변경될 때만 실행

  // // Google 접근 설정 변경 시 알림 추가
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     // 서버 메시지 대신 토스트 메시지만 표시
  //     showToast(`Google 접근이 ${googleAccess === "true" ? '활성화' : '비활성화'}되었습니다.`, 'info');
  //     // Google 접근 설정 쿠키로 저장 (선택 사항)
  //     setCookie('google_access', googleAccess);
  //   }
  // }, [googleAccess]); // googleAccess 변경 시 실행

  // 컴포넌트 마운트 시 쿠키에서 설정 로드 (선택 사항)
  useEffect(() => {
    const savedModel = getCookie('selected_model');
    const savedGoogleAccess = getCookie('google_access');
    
    if (savedModel) setModel(savedModel);
    if (savedGoogleAccess) setGoogleAccess(savedGoogleAccess);
  }, []);

  const scrollToBottom = () => {
    chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  // 채팅 로그 로드 함수
  const loadChatLogs = async (roomId: string, showToastOnLoad = false) => {
    try {
      setIsLoading(true);
      const data = await apiLoadChatLogs(roomId);

      appendMessage({ type: 'clear_messages', user: '', text: '', className: '' } as Message);

      if (data && data.status === 200 && data.logs) {
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
            const { userMessage, aiMessage } = processLogMessage(log);
            
            // 사용자 메시지 추가
            if (userMessage) {
              appendMessage(userMessage as Message);
            }
            
            // AI 응답 메시지 추가
            if (aiMessage) {
              appendMessage(aiMessage as Message);
            }
          });
        } else {
          // 빈 채팅방인 경우 환영 메시지 표시 (선택적)
          appendMessage({
            user: 'AI',
            text: '안녕하세요! 이 채팅방에서 새로운 대화를 시작해보세요.',
            className: 'bg-gray-600 text-white', // 항상 string
            type: '',
          } as Message);
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
        className: 'bg-red-600 text-white', // 항상 string
        type: 'error',
      } as Message);
    } finally {
      setIsLoading(false);
    }
  };

  const isIOS = () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document)
    );
  };

  return (
    <div
      className={[
        "flex flex-col items-center justify-center bg-gray-900 relative",
        isIOS() ? "ios-fix-viewport" : "h-[100vh]"
      ].join(" ")}
    >
      {/* 사이드바 추가 */}
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

      {/* Toast 컨테이너 - 모바일: 하단 중앙, 데스크탑: 우상단 */}
      <div className="fixed z-50 flex flex-col
        bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-xs
        sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:translate-x-0">
        {toasts.map((toast, i) => (
          <div key={toast.id} className="animate-fadeInOut mb-2">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
              index={i}
              show={true}
            />
          </div>
        ))}
      </div>
      
      <div
        className={[
          "flex flex-col text-white w-full max-w-3xl bg-gray-900",
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
          <ChatContainer
            messages={messages}
            isLoading={isLoading}
            chatContainerRef={chatContainerRef}
            handleRetrySend={handleRetrySend} // 추가
          />
          <ChatFooter
            userInput={userInput}
            setUserInput={setUserInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            scrollToBottom={scrollToBottom}
            model={model}           // 추가
            setModel={setModel}     // 추가
          />
        </main>
      </div>
    </div>
  );
};

export default Chatting;