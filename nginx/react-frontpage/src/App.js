import React, { useEffect } from "react";

function App() {
  const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_JS_KEY;
  const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // 더 자세한 로깅을 위한 함수
  const addLog = (event, data) => {
    const logs = JSON.parse(localStorage.getItem('kakaoLoginLogs') || '[]');
    logs.push({
      timestamp: new Date().toISOString(),
      event,
      data,
      url: window.location.href
    });
    localStorage.setItem('kakaoLoginLogs', JSON.stringify(logs));
    console.log(`로그 추가 - ${event}:`, data);
  };

  useEffect(() => {
    addLog('page_load', { 
      redirect_uri: KAKAO_REDIRECT_URI, 
      current_url: window.location.href,
      backend_url: BACKEND_URL 
    });

    // Kakao SDK 초기화
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_API_KEY);
      addLog('kakao_sdk_init', { success: true, api_key: KAKAO_API_KEY });
    }

    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      addLog('received_code', { code });

      // 현재 URL이 콜백 URL인 경우의 처리
      fetch(`${BACKEND_URL}/server/user/social/kakao/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({ code: code }),
      })
      .then(response => {
        addLog('backend_response', { 
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });
        return response.json();
      })
      .then(data => {
        addLog('backend_data', { data });
        if (data.token) {
          localStorage.setItem("jwt", data.token);
          alert("로그인 성공!");
          window.location.href = "/";
        } else {
          alert("로그인 실패!");
        }
      })
      .catch(err => {
        addLog('error', { 
          message: err.message,
          stack: err.stack,
          type: err.name
        });
        alert("로그인 처리 중 오류가 발생했습니다.");
      });
    }
  }, [KAKAO_API_KEY, BACKEND_URL, KAKAO_REDIRECT_URI]);

  const handleLogin = () => {
    addLog('login_attempt', { 
      redirect_uri: KAKAO_REDIRECT_URI,
      kakao_initialized: window.Kakao?.isInitialized()
    });
    
    if (!window.Kakao) {
      addLog('sdk_load_fail', {
        window_kakao: typeof window.Kakao,
      });
      return;
    }
    
    try {
      window.Kakao.Auth.authorize({
        redirectUri: KAKAO_REDIRECT_URI,
      });
    } catch (error) {
      addLog('auth_error', { 
        message: error.message,
        stack: error.stack,
        type: error.name
      });
    }
  };

  const checkLogs = () => {
    const logs = JSON.parse(localStorage.getItem('kakaoLoginLogs') || '[]');
    console.log('전체 로그 기록:', logs);
    alert(JSON.stringify(logs, null, 2));
  };

  const clearLogs = () => {
    localStorage.removeItem('kakaoLoginLogs');
    alert('로그가 초기화되었습니다.');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={handleLogin}>
        카카오 로그인
      </button>
      <button onClick={checkLogs} style={{ marginLeft: '10px' }}>
        로그 확인
      </button>
      <button onClick={clearLogs} style={{ marginLeft: '10px' }}>
        로그 초기화
      </button>
      <div style={{ marginTop: '20px' }}>
        <h3>현재 설정:</h3>
        <pre>
          {JSON.stringify({
            KAKAO_REDIRECT_URI,
            BACKEND_URL,
            current_url: window.location.href
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default App;