import React from 'react';

/**
 * Dark, glassmorphism-friendly auth layout — mesh gradient orbs + optional grain.
 */
const AuthPageShell = ({ children }) => (
  <div className="relative min-h-screen overflow-x-hidden bg-[#08080c] font-sans text-slate-100 antialiased">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute -top-[20%] -left-[15%] h-[min(70vw,520px)] w-[min(70vw,520px)] rounded-full bg-fuchsia-600/[0.22] blur-[100px] animate-blob"
        aria-hidden
      />
      <div
        className="absolute top-[15%] -right-[20%] h-[min(65vw,480px)] w-[min(65vw,480px)] rounded-full bg-cyan-400/[0.18] blur-[95px] animate-blob-slow [animation-delay:2.5s]"
        aria-hidden
      />
      <div
        className="absolute -bottom-[25%] left-[10%] h-[min(60vw,440px)] w-[min(60vw,440px)] rounded-full bg-violet-600/[0.2] blur-[90px] animate-blob [animation-delay:5s]"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 /%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22 /%3E%3C/svg%3E')]"
        aria-hidden
      />
    </div>
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-14">
      {children}
    </div>
  </div>
);

export default AuthPageShell;
