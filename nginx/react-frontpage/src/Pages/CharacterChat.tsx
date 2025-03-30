import React from 'react';
import Banner from '../Component/Banner/Banner';
import CharacterSwiper from '../Component/CharacterMain/CharacterSwiper';
import Header from '../Component/Header/Header';

const CharacterChatPage: React.FC = () => {
  return (   
    <div className="flex flex-col items-center w-full h-full bg-[#1a1918]">
      <Header />
      <div className="flex w-full max-w-[1280px] justify-center p-4">
        <div className="relative w-full h-full">
          <Banner />
          <div className="mt-10">
            <h2 className="text-3xl font-bold text-white mb-6">캐릭터 목록</h2>
            <p className="text-gray-400 mb-8">대화하고 싶은 캐릭터를 선택하세요</p>
            <CharacterSwiper />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterChatPage;
