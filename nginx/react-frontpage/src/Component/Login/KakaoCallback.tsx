import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../../Cookies';

const KakaoCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      alert('카카오 인가 코드가 없습니다.');
      navigate('/login');
      return;
    }

    // code를 백엔드로 보내 JWT 토큰을 받아 쿠키에 저장
    fetch('/server/user/social/kakao/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setCookie('jwt-token', data.token);
          // JWT에서 user_id 추출 및 저장 (구글과 동일)
          try {
            const base64Url = data.token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            if (payload && payload.sub) {
              setCookie('user_id', payload.sub);
            }
          } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
              console.error('JWT 토큰 디코딩 오류:', e);
            }
          }
          // 토큰이 저장되었으면 /home으로 강제 이동 (새로고침해도 /home)
          window.location.replace('/home');
        } else {
          alert(data.message || '카카오 로그인 실패');
          navigate('/login');
        }
      })
      .catch(() => {
        alert('카카오 로그인 처리 중 오류');
        navigate('/login');
      });
  }, [navigate]);

  // 처리 중에는 아무것도 안 보이게 하거나 로딩 메시지
  return <div>카카오 로그인 처리 중...</div>;
};

export default KakaoCallback;