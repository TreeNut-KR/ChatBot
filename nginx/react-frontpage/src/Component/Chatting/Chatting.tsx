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

interface ChattingProps {
  messages: Message[];
  onSend: (message: Message) => void;
}

const Chatting: React.FC<ChattingProps> = ({ messages, onSend }) => {
  const [userInput, setUserInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [model, setModel] = useState<string>('Llama');
  const [googleAccess, setGoogleAccess] = useState<string>("true");
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
  const handleDeleteChatRoom = async (roomId: string, title?: string) => {
    try {
      // 삭제 전에 먼저 UI 변경 - 사용자에게 피드백 제공
      showToast(`채팅방 "${title || '제목 없음'}" 삭제 중...`, 'info');

      await apiDeleteChatRoom(roomId);

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
        await fetchChatRoomList(); // await로 목록 갱신 완료 대기
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
      await fetchChatRoomList();  // 채팅방 목록 가져오기
    } else {
      setIsSidebarOpen(false);
    }
  };

  // 채팅방 목록 가져오기 함수 수정 - 에러 처리 개선
  const fetchChatRoomList = async () => {
    try {
      setIsLoadingRooms(true);
      
      const data = await fetchChatRooms();
      
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
      
      const responseData = await createNewChatRoom();
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
      const responseData = await createNewChatRoom();
      
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
      const roomId = localStorage.getItem('mongo_chatroomid');
      if (!roomId) throw new Error('채팅방 ID가 없습니다.');
      
      // 요청 body 콘솔에 출력
      console.log('서버로 전송하는 데이터:', {
        input_data_set: inputText,
        route_set: model,
        google_access_set: googleAccess
      });

      const responseData = await getChatResponse(
        roomId, 
        inputText, 
        model, 
        googleAccess
      );
      
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

  // 채팅 로그 로드 함수
  const loadChatLogs = async (roomId: string) => {
    try {
      setIsLoading(true);
      
      const data = await apiLoadChatLogs(roomId);
      
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
            const { userMessage, aiMessage } = processLogMessage(log);
            
            // 사용자 메시지 추가
            if (userMessage) {
              appendMessage(userMessage);
            }
            
            // AI 응답 메시지 추가
            if (aiMessage) {
              appendMessage(aiMessage);
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
          onDeleteRoom={handleDeleteChatRoom}
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