import React, { useEffect, useRef } from "react";
import './text.css';

const Text = ({ messages }) => {
    const chatContainerRef = useRef(null);

    useEffect(() => {
        // 메시지가 변경될 때마다 스크롤을 최하단으로 이동
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]); // messages가 변경될 때마다 실행

    return (
        <div className="Text" ref={chatContainerRef}>
            {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                    {msg.text}
                </div>
            ))}
        </div>
    );
}

export default Text;
