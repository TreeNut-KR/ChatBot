import React from 'react';
import { ChatRoom, ChatSidebarProps } from '../Types';
import { getCookie } from '../../../Cookies';

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  rooms, 
  onClose, 
  onSelectRoom, 
  onDeleteRoom, 
  isLoading, 
  onCreateNewChat 
}) => {
  
  // 현재 선택된 채팅방 ID 쿠키에서 가져오기
  const currentRoomId = getCookie('mongo_chatroomid');
  
  // 제목 텍스트를 최대 15자로 제한하는 함수
  const truncateTitle = (title: string | undefined): string => {
    if (!title) return '제목 없음';
    return title.length > 15 ? `${title.substring(0, 15)}...` : title;
  };

  // 날짜 형식화 함수 - yyyy-mm-dd HH:MM 형식으로 표시
  const formatDate = (dateString: string | undefined): string => {
    // 날짜 문자열이 없는 경우 기본값 제공
    if (!dateString) {
      return '날짜 정보 없음';
    }
    
    try {
      const date = new Date(dateString);
      
      // 날짜가 유효한지 확인
      if (isNaN(date.getTime())) {
        console.warn('유효하지 않은 날짜 형식:', dateString);
        return '유효하지 않은 날짜';
      }
      
      // yyyy-mm-dd HH:MM 형식으로 포맷팅
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error('날짜 포맷 에러:', error, '입력 값:', dateString);
      return '날짜 처리 오류';
    }
  };

  // 방 삭제 핸들러 - 별도 함수로 분리하여 이벤트 전파 문제 해결
  const handleDeleteRoom = (e: React.MouseEvent, roomId: string, title?: string) => {
    e.preventDefault(); // 기본 동작 방지
    e.stopPropagation(); // 이벤트 전파 중지
    
    console.log('방 삭제 시도:', roomId, title);
    
    // 사용자 확인 후 삭제
    if (window.confirm(`"${title || '제목 없음'}" 채팅방을 삭제하시겠습니까?`)) {
      onDeleteRoom(roomId, title || undefined);
    }
  };

  // 방 ID 추출을 위한 헬퍼 함수
  const getRoomId = (room: ChatRoom): string => {
    const roomId = room.mongo_chatroomid || room.roomid || room.id || room.chatroom_id;
    if (!roomId) {
      console.warn('채팅방 ID가 없습니다:', room);
      return '';
    }
    return roomId;
  };

  // 방 제목 추출을 위한 헬퍼 함수
  const getRoomTitle = (room: ChatRoom): string => {
    return room.Title || room.title || '제목 없음';
  };

  // 방 시간 정보 추출을 위한 헬퍼 함수
  const getRoomTimeInfo = (room: ChatRoom): string => {
    return room.timestamp || room.updatedAt || room.updated_at || room.created_at || new Date().toISOString();
  };

  // 첫 렌더링에 rooms 디버깅
  React.useEffect(() => {
    if (rooms && rooms.length > 0) {
      console.log('채팅방 목록 (총 ' + rooms.length + '개):', rooms);
    }
  }, [rooms]);

  return (
    <div className="fixed top-0 right-0 h-full w-72 bg-gray-800 shadow-lg z-50 transform transition-all duration-300 ease-in-out overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">내 채팅방</h2>
        <div className="flex items-center gap-2">
          {/* 새 채팅방 생성 버튼 */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              onCreateNewChat();
            }}
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
          {rooms.map((room, index) => {
            // 모든 가능한 ID 필드를 확인하여 추출
            const roomId = getRoomId(room);
            if (!roomId) return null; // ID가 없는 방은 표시하지 않음
            
            const isSelected = roomId === currentRoomId;
            const roomTitle = getRoomTitle(room);
            const timeInfo = getRoomTimeInfo(room);
            
            return (
              <div 
                key={`${roomId || index}-${index}`}
                className={`p-3 rounded-md transition-colors ${
                  isSelected 
                    ? 'bg-indigo-600 border border-indigo-400' 
                    : 'bg-gray-700 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col">
                  {/* 클릭 영역과 삭제 버튼 분리 */}
                  <div 
                    className="cursor-pointer flex flex-col"
                    onClick={(e) => {
                      e.preventDefault();
                      if (roomId) onSelectRoom(roomId);
                      else console.error('방 선택 실패: 채팅방 ID가 없습니다');
                    }}
                  >
                    <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                      {truncateTitle(roomTitle)}
                    </div>
                    <div className={`text-xs mt-1 ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {formatDate(timeInfo)}
                    </div>
                  </div>
                  
                  {/* 삭제 버튼 - 별도 영역으로 분리 */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={(e) => handleDeleteRoom(e, roomId, roomTitle)}
                      className="text-xs px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white transition-colors"
                      title="채팅방 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatSidebar;