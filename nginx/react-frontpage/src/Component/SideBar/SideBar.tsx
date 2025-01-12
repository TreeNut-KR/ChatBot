'use client';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.css';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <aside className="h-screen max-w-[80px] min-w-[60px] px-2 py-5 bg-[#161514]">
      <div className="mb-4 cursor-pointer" onClick={() => handleNavigation('/')}> 
        <img src="images/logo.png" alt="Logo" className="w-full h-auto" />
      </div>
      <div className="mt-4 flex flex-col gap-5">
        <button
          onClick={() => handleNavigation('/')}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-search fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold">홈</span>
        </button>

        <button
          onClick={() => handleNavigation('/CharacterChat')}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-comments fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold">캐릭터 챗</span>
        </button>

        <button
          onClick={() => handleNavigation('/login')}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-user-shield fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold">로그인</span>
        </button>

        <button
          onClick={() => handleNavigation('/resister')}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-tags fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold">회원가입</span>
        </button>

        <button
          onClick={() => handleNavigation('/alerts')}
          className="flex flex-col items-center text-white py-2"
        >
          <span className="p-2 hover:bg-[#2A2927] hover:rounded-md hover:text-[#FFA500] flex justify-center items-center w-10 h-10">
            <i className="fas fa-exclamation-triangle fa-lg"></i>
          </span>
          <span className="mt-1 text-[14px] font-semibold">개인정보</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
