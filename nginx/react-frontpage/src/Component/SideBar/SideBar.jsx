import React from "react";
import './sidebar.css';
import { useNavigate } from 'react-router-dom';
import TreeNut_Logo from './TreeNut_Logo.png';

export default function SideBar() {
  const navigate = useNavigate(); // useNavigate 훅을 사용하여 navigate 함수 생성

  const handleLoginClick = () => {
    navigate('/login'); // 로그인 페이지로 이동
  };

  const handleResisterClick = () => {
    navigate('/resister'); // 회원가입 페이지로 이동
  };

  const handleHomeChatClick = () => {
    navigate('/HomeChat'); // 캐릭터 생성 페이지로 이동
  };
  
  const handleHomeClick = () => {
    navigate('/'); // 홈 페이지로 이동
  };

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        <div className="SidebarLogo">
          <img 
            src={TreeNut_Logo} 
            alt="TreeNut Logo" 
            className="SideAvatar"
          />
        </div>
        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleHomeClick}>
            홈
          </div>    
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText">
            캐릭터 채팅
          </div>
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleHomeChatClick}>
            캐릭터 생성
          </div>
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleLoginClick}>
            로그인
          </div>
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleResisterClick}>
            회원가입
          </div>
        </div>
      </div>
    </div>
  )
}
