import React, { useState } from "react";
import './HomeChat.css';
import Text from "../Component/Text/Text";
import Chatting from "../Component/Chatting/Chatting";
import ChattingMain from "../Component/ChattingMain/ChattingMain";

export default function HomeChat() {
    const [messages, setMessages] = useState([
        { text: "안녕하세요, 반갑습니다. 저희 TreeNut 챗봇은 LLAMA Ai 모델을 기반으로 사용자에게 정답에 최대한 가까운 답변을 제공해드리는 Ai챗봇 사이트입니다.", type: "client" },
    ]);

    const handleSendMessage = (message) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { text: message, type: "user" }
        ]);
    };

    return( 
        <div className="home">
            <div className="chat-container">
                <div className="HomeText">TreeNut</div>
                
                <ChattingMain onSend={handleSendMessage} />
            </div>  
        </div>
    );
}
