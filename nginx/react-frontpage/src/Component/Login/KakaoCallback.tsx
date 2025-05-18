import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleKakaoSocialLogin } from './Login';

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

    handleKakaoSocialLogin(code, (msg) => alert(msg)).then((success) => {
      if (success) {
        // 카카오 로그인 성공 시 /home으로 이동
        navigate('/home', { replace: true });
      } else {
        navigate('/login');
      }
    });
  }, [navigate]);

  return <div>카카오 로그인 처리 중...</div>;
};

export default KakaoCallback;