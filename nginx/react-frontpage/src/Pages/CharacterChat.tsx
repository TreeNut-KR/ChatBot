import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from '../Component/Banner/Banner';
import CharacterSwiper from '../Component/CharacterMain/CharacterSwiper';
import Header from '../Component/Header/Header';
import CharacterDetailModal from '../Component/CharacterMain/CharacterDetailModal';
import axios from 'axios';
import CharacterChatSidebar from '../Component/CharacterMain/CharacterChatSidebar';

// 쿠키에서 값을 읽어오는 함수 (Profile.tsx에서 가져옴)
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

const CharacterChatPage: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [myRooms, setMyRooms] = useState<
    { roomid: string; Title: string; character_name: string; character_img: string }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
        // 무시 또는 필요시 에러 처리
      }
    };
    fetchMyRooms();
  
    // 포커스 될 때마다 목록 새로고침
    window.addEventListener('focus', fetchMyRooms);
    return () => window.removeEventListener('focus', fetchMyRooms);
  }, []);
  
  // 캐릭터 클릭 시 모달 오픈
  const handleCharacterClick = (character: any) => {
    setSelectedCharacter(character);
  };

  // 채팅 시작 버튼 클릭 시
  const handleChat = async (character: any) => {
    setSelectedCharacter(null);
    try {
      const token = getCookieValue('jwt-token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }
      const res = await axios.get(
        `/server/chatroom/character/${character.idx}`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      const roomId = res.data?.mysql_characterroom?.mongo_chatroomid;
      if (roomId) {
        navigate(`/chat/${roomId}`);
      } else {
        alert('채팅방 생성에 실패했습니다.');
      }
    } catch (e) {
      alert('채팅방 생성 중 오류가 발생했습니다.');
    }
  };

  // 내 채팅방 클릭 시
  const handleRoomClick = (roomid: string) => {
    setSidebarOpen(false);
    navigate(`/chat/${roomid}`);
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <header className="flex justify-between items-center w-full h-[56px] px-5 bg-[#1a1918] border-b border-transparent relative">
        <h1 className="text-lg font-bold text-white">TreeNut Chat</h1>
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
      {/* 사이드바 */}
      <CharacterChatSidebar
        rooms={myRooms}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelectRoom={handleRoomClick}
      />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="relative w-full h-full">
          <Banner />
          <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">캐릭터</h2>
              <Link to="/characterAdd" className="px-4 py-2 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0]">
                캐릭터 추가
              </Link>
            </div>
            <p className="text-gray-400 mb-8">대화하고 싶은 캐릭터를 선택하세요</p>
            <CharacterSwiper onCharacterClick={handleCharacterClick} />
          </div>
        </div>
      </div>
      {selectedCharacter && (
        <CharacterDetailModal
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
          onChat={() => handleChat(selectedCharacter)}
        />
      )}
    </div>
  );
};

export default CharacterChatPage;