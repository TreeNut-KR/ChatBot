import React, { useState } from 'react';
import './chatting.css';

const ChatHeader = () => (
    <div className="chat-header">
        <h1>TreeNut ChatBot</h1>
    </div>
);

const ChatMessage = ({ text, isUser }) => (
    <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
        {text}
    </div>
);

const ChatContainer = ({ messages }) => (
    <div className="chat-container">
        {messages.map((msg, index) => (
            <ChatMessage key={index} text={msg.text} isUser={msg.isUser} />
        ))}
    </div>
);

const ChatFooter = ({ userInput, setUserInput, handleSend, isSending }) => (
    <div className="chat-footer">
        <form onSubmit={handleSend}>
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                autoComplete="off"
            />
            <button type="submit" disabled={isSending}>전송</button>
        </form>
    </div>
);

const Chatting = () => {
    const [userInput, setUserInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;
    
        const newMessage = { text: userInput, isUser: true };
        setMessages((prev) => [...prev, newMessage]);
        setUserInput('');
    
        setIsSending(true);
    
        const url = 'http://localhost:3000/server/chatroom/office';
        const token = localStorage.getItem('jwt-token'); // 로컬 스토리지에서 JWT 토큰 가져오기
        if (!token) {
            setMessages((prev) => [...prev, { text: '토큰이 없습니다. 로그인 후 다시 시도하세요.', isUser: false }]);
            setIsSending(false);
            return;
        }
    
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // 가져온 토큰 추가
        };
    
        try {
            console.log('API 호출 URL:', url);
            console.log('Authorization 헤더:', headers.Authorization);
    
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ input_data_set: userInput }),
            });
    
            if (!response.ok) throw new Error('서버 응답 오류');
    
            const data = await response.json();
            setMessages((prev) => [...prev, { text: data.message || 'AI 응답 없음', isUser: false }]);
        } catch (error) {
            setMessages((prev) => [...prev, { text: '메시지 전송 실패: ' + error.message, isUser: false }]);
        } finally {
            setIsSending(false);
        }
    };
    

    return (
        <div className="chatting">
            <ChatHeader />
            <main>
                <ChatContainer messages={messages} />
            </main>
            <ChatFooter 
                userInput={userInput} 
                setUserInput={setUserInput} 
                handleSend={handleSend} 
                isSending={isSending} 
            />
        </div>
    );
};

export default Chatting;
