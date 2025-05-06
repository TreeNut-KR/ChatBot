import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from '../Component/Banner/Banner';
import CharacterSwiper from '../Component/CharacterMain/CharacterSwiper';
import Header from '../Component/Header/Header';
import CharacterDetailModal from '../Component/CharacterMain/CharacterDetailModal';
import axios from 'axios';

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
  const [myRooms, setMyRooms] = useState<{ roomid: string; Title: string }[]>([]);
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
    navigate(`/chat/${roomid}`);
  };

  return (
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <header className="flex justify-between items-center w-full h-[56px] px-5 bg-[#1a1918] border-b border-transparent relative">
        <h1 className="text-lg font-bold text-white">TreeNut 챗</h1>
        {/* 우측 상단 내 채팅방 목록 */}
        <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
          <div className="bg-[#232323] rounded-lg shadow-lg p-4 min-w-[220px]">
            <div className="font-bold text-white mb-2">내 채팅방 목록</div>
            {myRooms.length === 0 ? (
              <div className="text-gray-400 text-sm">채팅방이 없습니다.</div>
            ) : (
              <ul>
                {myRooms.map((room) => (
                  <li
                    key={room.roomid}
                    className="text-blue-300 hover:underline cursor-pointer truncate mb-1"
                    title={room.Title}
                    onClick={() => handleRoomClick(room.roomid)}
                  >
                    {room.Title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="relative w-full h-full">
          <Banner />
          <div className="mt-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">캐릭터 목록</h2>
              <Link to="/characterAdd" className="px-4 py-2 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0]">
                캐릭터 추가 +
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