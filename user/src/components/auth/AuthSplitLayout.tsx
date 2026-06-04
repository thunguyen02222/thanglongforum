import React from 'react';
import { LocaleSwitcher } from '@components/LocaleSwitcher';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Left: background image + centered overlay image */}
      <div
        className="relative w-full md:w-1/2 min-h-[380px] md:min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: 'url(/image/nen.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Overlay mờ nhẹ */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Ảnh trên nền */}
        <div className="relative z-10 flex items-center justify-center w-full h-full px-8 py-12">
          <img
            src="/image/anhtrennen.png"
            alt="Forum banner"
            className="max-w-[80%] max-h-[70vh] object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10 md:py-12 relative w-full md:w-1/2">
        <div className="hidden absolute top-4 right-4 md:top-6 md:right-6">
          <LocaleSwitcher />
        </div>
        <div className="w-full max-w-[420px] mx-auto px-4 md:px-0">
          {children}
        </div>
      </div>
    </div>
  );
}
