// import React, { useState } from "react";
// import './HomeChat.css';
// import Chatting from "../Component/Chatting/Chatting";
// import ChattingMain from "../Component/ChattingMain/ChattingMain";

// // Message 타입을 HomeChat 컴포넌트 내에서 직접 정의
// interface Message {
//     user: string;
//     text: string;
//     type:string;
//     className: string;
// }

// // HomeChat 컴포넌트
// const HomeChat: React.FC = () => {
//     const [messages, setMessages] = useState<Message[]>([
//         {
//             user: "AI",
//             text: "안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.",
//             className: "client",
//             type:"intro"
//         },
//     ]);

//     // 메시지 전송 처리 함수
//     const handleSendMessage = (message: string): void => {
//         setMessages((prevMessages) => [
//             ...prevMessages,
//             { user: "User", text: message, className: "user" , type: "user"},
//         ]);
//     };

//     return (
//         <div className="HomeChat">
//             <div className="chat-container">
//                 <div className="HomeChatText">TreeNut</div>
//                 {/* 메시지 전달 */}
//                 <Chatting messages={messages} onSend={handleSendMessage} />
//                 <ChattingMain onSend={handleSendMessage} />
//             </div>
//         </div>
//     );
// };

// export default HomeChat;
