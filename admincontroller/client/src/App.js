import React, { useState } from 'react';
import DriveManager from './components/DriveManager';
import AdminAuth from './components/AdminAuth';
import './App.css';

function App() {
  const [authed, setAuthed] = useState(!!localStorage.getItem('admin-token'));

  const handleLogout = async () => {
    const token = localStorage.getItem('admin-token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      localStorage.removeItem('admin-token');
      setAuthed(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>TreeNut Admin</h1>
        {authed && (
          <button onClick={handleLogout} style={{ marginLeft: 20 }}>
            로그아웃
          </button>
        )}
      </header>
      <main>
        {authed ? <DriveManager /> : <AdminAuth onAuthSuccess={() => setAuthed(true)} />}
      </main>
    </div>
  );
}

export default App;