import React from 'react';

const BouncingDotsLoader = () => {
  return (
    <div className="flex justify-center gap-1 p-1">
      <div className="w-2 h-2 rounded-full bg-gray-500 opacity-100 animate-bouncing-loader"></div>
      <div
        className="w-2 h-2 rounded-full bg-gray-500 opacity-100 animate-bouncing-loader"
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div
        className="w-2 h-2 rounded-full bg-gray-500 opacity-100 animate-bouncing-loader"
        style={{ animationDelay: '0.4s' }}
      ></div>
    </div>
  );
};

export default BouncingDotsLoader;
