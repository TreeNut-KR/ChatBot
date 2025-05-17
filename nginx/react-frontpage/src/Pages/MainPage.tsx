import React from 'react';
import { Outlet } from 'react-router-dom';

const MainPage: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col bg-[#1a1918] text-white min-h-screen">
      <main className="flex flex-1 w-full h-full items-center justify-center">
        {/* 모바일: 세로, 데스크톱: 가로 배치 */}
        <div className="flex flex-col md:flex-row w-full h-full items-start md:items-center justify-center gap-0 md:gap-0">
          {/* 텍스트 컨테이너 */}
          <div className="text-black flex flex-col items-center md:items-end w-full md:w-auto px-4 md:px-0 mb-0 md:mb-0">
            <header className="w-full flex flex-col items-center md:items-end px-0 md:px-4">
              <h1 className="text-xl md:text-3xl font-bold mb-0 md:mb-4 text-indigo-400 text-center md:text-right">TreeNut ChatBot</h1>
              <p className="text-xs md:text-base text-gray-300 mb-2 md:mb-6 text-center md:text-right leading-snug md:leading-relaxed">
                AI와 대화하며 정보를 얻고, 다양한 기능을 경험해보세요.<br />
                로그인 후 채팅방을 생성하여 대화를 시작할 수 있습니다.
              </p>
            </header>
          </div>
          {/* Outlet 컴포넌트 */}
          <div className="flex items-start md:items-center justify-center w-full md:w-auto mt-0 md:mt-0">
            <div className="w-full max-w-xs md:max-w-md px-4 md:px-12 flex items-center justify-center">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full text-center text-gray-500 text-xs md:text-sm py-2 md:py-4 absolute bottom-0 left-0">
        © {new Date().getFullYear()} TreeNut. All rights reserved.
      </footer>
    </div>
  );
};

export default MainPage;