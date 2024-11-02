import React from "react";
import './sidebar.css';
import { useNavigate } from 'react-router-dom';

export default function SideBar() {
  const navigate = useNavigate(); // useNavigate 훅을 사용하여 navigate 함수 생성

  const handleLoginClick = () => {
    navigate('/userProfile'); // 로그인 페이지로 이동
  };

  const handleHomeChatClick = () => {
    navigate('/HomeChat'); // 로그인 페이지로 이동
  };
  const handleHomeClick = () => {
    navigate('/'); // 로그인 페이지로 이동
  };
  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        <div className="SidebarLogo">
          <div className="SidebarLogoText">TreeNut</div>
        </div>
        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleHomeClick}>
            Home
          </div>    
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText">
            Character Chat
          </div>
        </div>

        <div className="sidebarListItem">
          <div className="SidebarText" onClick={handleHomeChatClick}>
            Character Create
          </div>
        </div>

        <div className="sidebarListItem">
          <button className="SidebarButton" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
