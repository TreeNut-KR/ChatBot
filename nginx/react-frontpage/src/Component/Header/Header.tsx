'use client';
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex justify-between items-center w-full h-[56px] px-5 bg-[#1a1918] border-b border-transparent">
      <h1 className="text-lg font-bold text-white">TreeNut Chat</h1>
    </header>
  );
};

export default Header;
