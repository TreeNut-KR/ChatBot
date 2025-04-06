import React from 'react';
import { ChatSidebarProps } from '../Types';

const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  rooms, 
  onClose, 
  onSelectRoom, 
  onDeleteRoom, 
  isLoading, 
  onCreateNewChat 
}) => {
  
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

export default ChatSidebar;