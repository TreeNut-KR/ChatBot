import React from 'react';
import Banner from '../Component/Banner/Banner';
import CharacterChat from '../Component/Chartacter/CharacterSwiper'; // 캐릭터 채팅 컴포넌트 추가
import Header from '../Component/Header/Header';

const App: React.FC = () => {
  return (   
    <div className="flex flex-col items-center w-full max-h-full">
      <Header />
      <div className="flex w-full justify-center">
        <div className="relative max-w-[808px] p-5 pt-10 pb-24 w-full h-full mx-auto">
          <Banner />
          <CharacterChat />
          <CharacterChat />
          <CharacterChat />
        </div>
      </div>
    </div>
  );
};

export default App;
