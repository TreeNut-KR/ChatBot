import React from 'react';
import DriveManager from './components/DriveManager';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>TreeNut Admin</h1>
      </header>
      <main>
        <DriveManager />
      </main>
    </div>
  );
}

export default App;