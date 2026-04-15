import React from 'react';

/**
 * Auth-only layout: no marketing navbar.
 * Scrollable so tall cards (reset-password) never clip on short viewports.
 */
const AuthLightShell = ({ children }) => (
  <div className="relative min-h-screen bg-[#e8eef3]">
    {/* background layers */}
    <div
      className="pointer-events-none fixed inset-0 bg-gradient-to-b from-cyan-50/80 via-slate-50 to-blue-50/70"
      aria-hidden
    />
    <div
      className="pointer-events-none fixed -top-20 left-1/2 h-[22rem] w-[min(140%,56rem)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.22),transparent_68%)]"
      aria-hidden
    />
    <div
      className="pointer-events-none fixed right-[-10%] top-[15%] h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl"
      aria-hidden
    />
    <div
      className="pointer-events-none fixed bottom-[-5%] left-[-5%] h-[22rem] w-[22rem] rounded-full bg-cyan-400/15 blur-3xl"
      aria-hidden
    />
    <div
      className="pointer-events-none fixed inset-0 opacity-[0.55] [background-image:url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cg%20stroke%3D%22%23a8b0c4%22%20stroke-width%3D%220.65%22%20opacity%3D%220.5%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M16%208v16M8%2016h16%22/%3E%3C/g%3E%3C/svg%3E')]"
      style={{ backgroundSize: '32px 32px' }}
      aria-hidden
    />

    {/* Scrollable content wrapper — centres vertically when content < viewport, scrolls when it overflows */}
    <div className="relative z-10 flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-6 sm:py-10">
        {children}
      </main>
    </div>
  </div>
);

export default AuthLightShell;
