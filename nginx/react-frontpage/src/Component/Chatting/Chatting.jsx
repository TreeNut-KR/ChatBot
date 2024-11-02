import React, { useState } from 'react';
import './chatting.css'; // 스타일을 위한 CSS 파일을 따로 작성

const Chatting = ({ onSend }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    return (
        <div className="chat-input-container">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="메시지를 입력하세요..."
                className="chat-input"
            />
            <button onClick={handleSend} className="send-button">전송</button>
        </div>
    );
};

export default Chatting;
