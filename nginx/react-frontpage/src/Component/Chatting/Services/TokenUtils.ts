import { getCookie, removeCookie } from '../../../Cookies';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// JWT 토큰 디코딩 함수
export const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('토큰 디코딩 오류:', e);
    return null;
  }
};

// 토큰 만료 여부 확인
export const isTokenExpired = (token: string): boolean => {
  if (!token) return true;
  
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  // exp는 초 단위로 저장되므로 1000을 곱해 밀리초로 변환
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  
  return currentTime >= expirationTime;
};

// 로그인 상태 확인 및 만료된 경우 로그아웃
export const checkLoginStatus = () => {
  const token = getCookie('token') || getCookie('jwt-token');
  
  if (!token || isTokenExpired(token)) {
    // 토큰이 없거나 만료된 경우 로그아웃 처리
    console.log('토큰이 만료되었거나 없습니다. 로그아웃 처리합니다.');
    
    // 모든 인증 관련 쿠키 제거
    removeCookie('token');
    removeCookie('jwt-token');
    removeCookie('user_id');
    removeCookie('user_email');
    removeCookie('avatar');
    return false;
  }
  
  return true;
};

// 토큰 체크 후 만료 시 리다이렉션 처리
export const validateTokenAndRedirect = () => {
  if (!checkLoginStatus()) {
    // 로그인 페이지로 리다이렉트
    window.location.href = '/login?expired=true';
    return false;
  }
  return true;
};