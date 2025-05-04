import React from 'react';
import { Link } from 'react-router-dom';
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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-white">캐릭터 목록</h2>
              <Link to="/characterAdd" className="px-4 py-2 bg-[#3b7cc9] text-white rounded-lg hover:bg-[#2d62a0]">
                캐릭터 추가 +
              </Link>
            </div>
            <p className="text-gray-400 mb-8">대화하고 싶은 캐릭터를 선택하세요</p>
            <CharacterSwiper />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterChatPage;
