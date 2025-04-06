import Cookies from 'js-cookie';

// 기본 만료일 설정 (7일)
const DEFAULT_EXPIRY = 7;

// 쿠키 설정 함수
export const setCookie = (name: string, value: string, days: number = DEFAULT_EXPIRY) => {
  Cookies.set(name, value, { expires: days, path: '/' });
};

// 쿠키 가져오는 함수
export const getCookie = (name: string): string | undefined => {
  return Cookies.get(name);
};

// 쿠키 삭제 함수
export const removeCookie = (name: string) => {
  Cookies.remove(name, { path: '/' });
};

// 객체를 JSON 문자열로 변환하여 쿠키로 저장
export const setObjectCookie = (name: string, value: any, days: number = DEFAULT_EXPIRY) => {
  setCookie(name, JSON.stringify(value), days);
};

// 쿠키에서 JSON 데이터 파싱해서 가져오기
export const getObjectCookie = (name: string) => {
  const value = getCookie(name);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
};