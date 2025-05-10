import React from 'react';
import { Outlet } from 'react-router-dom';

const MainPage: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col bg-[#1a1918] text-white">
      <main className="flex flex-1 w-full h-full items-center justify-center">
        {/* flex-row로 두 요소를 나란히 배치 */}
        <div className="flex flex-row w-full h-full items-center justify-center">
          {/* 텍스트 컨테이너 */}
          <div className="text-black flex flex-col items-end mr-20">
            <header className="w-full flex flex-col items-end px-4">
              <h1 className="text-3xl font-bold mb-4 text-indigo-400 text-right">TreeNut ChatBot</h1>
              <p className="text-base text-gray-300 mb-6 text-right">
                AI와 대화하며 정보를 얻고, 다양한 기능을 경험해보세요.<br />
                로그인 후 채팅방을 생성하여 대화를 시작할 수 있습니다.
              </p>
            </header>
          </div>
          {/* Outlet 컴포넌트 */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md px-12 flex items-center justify-center">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full text-center text-gray-500 text-sm py-4 absolute bottom-0 left-0">
        © {new Date().getFullYear()} TreeNut. All rights reserved.
      </footer>
    </div>
  );
};

export default MainPage;
