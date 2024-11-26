import React, { useEffect } from "react";

function App() {
  const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_JS_KEY; // 여기에 Kakao JavaScript Key를 입력하세요.

  useEffect(() => {
    // Kakao SDK 초기화
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_API_KEY);
      console.log("Kakao SDK initialized:", window.Kakao.isInitialized());
    }
  }, []);

  const handleLogin = () => {
    window.Kakao.Auth.login({
      success: (authObj) => {
        console.log("카카오 로그인 성공", authObj);
  
        window.Kakao.API.request({
          url: "/v2/user/me",
          success: (res) => {
            console.log("사용자 정보", res);
            
            // 백엔드로 카카오 사용자 정보 전송
            fetch("http://localhost:8080/server/user/kakao-login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                kakaoId: res.id,
                email: res.kakao_account.email,
                nickname: res.kakao_account.profile.nickname,
                profileImage: res.kakao_account.profile.profile_image_url,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.token) {
                  // JWT 토큰 저장 (예: localStorage)
                  localStorage.setItem("jwt", data.token);
                  alert("로그인 성공!");
                } else {
                  alert("로그인 실패!");
                }
              })
              .catch((err) => console.error("백엔드 요청 실패", err));
          },
          fail: (err) => console.error("사용자 정보 요청 실패", err),
        });
      },
      fail: (err) => console.error("카카오 로그인 실패", err),
    });
  };  

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>카카오톡 로그인 테스트</h1>
      <button
        onClick={handleLogin}
        style={{
          backgroundColor: "#FEE500",
          border: "none",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        카카오 로그인
      </button>
    </div>
  );
}

export default App;
