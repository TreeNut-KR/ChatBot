import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Banner from '../Component/Banner/Banner';
import CharacterSwiper from '../Component/CharacterMain/CharacterSwiper';
import Header from '../Component/Header/Header';
import CharacterDetailModal from '../Component/CharacterMain/CharacterDetailModal';

const CharacterChatPage: React.FC = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const navigate = useNavigate();

  // 캐릭터 클릭 시 모달 오픈
  const handleCharacterClick = (character: any) => {
    setSelectedCharacter(character);
  };

  // 채팅 시작 버튼 클릭 시
  const handleChat = (uuid: string) => {
    setSelectedCharacter(null);
    navigate(`/chat/${uuid}`);
  };

  return (   
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
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
          onChat={handleChat}
        />
      )}
    </div>
  );
};

export default CharacterChatPage;
