import React, { useEffect } from "react";

function App() {
  const KAKAO_API_KEY = process.env.REACT_APP_KAKAO_JS_KEY;

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");
    if (code) {
      console.log("카카오 인가 코드:", code); // ✅ 인가 코드 로그 확인
  
      fetch("http://localhost:8080/server/user/social/kakao/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("백엔드 응답:", data); // ✅ 백엔드 응답 확인
          if (data.token) {
            localStorage.setItem("jwt", data.token);
            alert("로그인 성공!");
          } else {
            alert("로그인 실패!");
          }
        })
        .catch((err) => console.error("백엔드 요청 실패", err));
    }
  }, [KAKAO_API_KEY]);  

  const handleLogin = () => {
    window.Kakao.Auth.authorize({
      redirectUri: "http://localhost/server/oauth/callback/kakao", // ✅ 카카오 로그인 후 리다이렉트될 주소
    });
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>카카오톡 소셜 로그인/회원가입</h1>
      <button
        onClick={handleLogin}
        style={{
          backgroundColor: "#FEE500",
          border: "none",
          padding: "10px 20px",
          fontSize: "16px",
          cursor: "pointer",
          marginRight: "10px",
        }}
      >
        카카오 로그인
      </button>
    </div>
  );
}

export default App;
