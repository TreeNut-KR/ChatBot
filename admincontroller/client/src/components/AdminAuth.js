import React, { useState, useEffect, useRef } from 'react';

function AdminAuth({ onAuthSuccess }) {
  const [challenge, setChallenge] = useState('');
  const [clientHash, setClientHash] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [timer, setTimer] = useState(300); // 5분(300초)
  const inputRef = useRef(null);

  // 챌린지 및 타이머 초기화
  useEffect(() => {
    fetch('/api/auth/challenge')
      .then(res => res.json())
      .then(data => {
        setChallenge(data.challenge);
        setTimer(300);
      });
  }, []);

  // 타이머 감소
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // 타이머 만료 시 챌린지 새로고침
  useEffect(() => {
    if (timer === 0) {
      setError('시간이 만료되었습니다. 새 인증값을 받아주세요.');
    }
  }, [timer]);

  const handleCopy = () => {
    if (challenge) {
      navigator.clipboard.writeText(challenge);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientHash })
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem('admin-token', token);
      onAuthSuccess();
    } else {
      setError('인증 실패. 다시 시도하세요.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // 128자 붙여넣기 감지 (입력이 모두 반영된 후 인증)
  const handleChange = (e) => {
    const value = e.target.value;
    setClientHash(value);
  };

  // clientHash가 128자가 되었을 때 자동 인증 (입력이 완전히 반영된 후)
  useEffect(() => {
    if (clientHash.length === 128) {
      handleSubmit();
    }
  }, [clientHash]);

  const handleRefresh = () => {
    fetch('/api/auth/challenge')
      .then(res => res.json())
      .then(data => {
        setChallenge(data.challenge);
        setTimer(300);
        setError('');
        setClientHash('');
      });
  };

  const formatTime = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div>
      <h2>관리자 인증</h2>
      <div style={{ marginBottom: 8 }}>
        <span style={{ color: timer <= 30 ? 'red' : '#333', fontWeight: 600 }}>
          남은 시간: {formatTime(timer)}
        </span>
        <button
          onClick={handleRefresh}
          style={{
            marginLeft: 12,
            fontSize: 13,
            padding: '2px 8px',
            cursor: 'pointer'
          }}
        >
          새로고침
        </button>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '10px 0'
      }}>
        <span style={{
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          fontSize: 18,
          textAlign: 'center'
        }}>{challenge}</span>
        <button
          onClick={handleCopy}
          style={{
            marginTop: 8,
            padding: '2px 8px',
            fontSize: 13,
            cursor: 'pointer'
          }}
        >
          {copied ? '복사됨!' : '복사'}
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="password"
          placeholder="해시값 입력"
          value={clientHash}
          onChange={handleChange}
          style={{ width: 350 }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          disabled={timer === 0}
        />
        <button type="submit" disabled={timer === 0}>인증</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default AdminAuth;