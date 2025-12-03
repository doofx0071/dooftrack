import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="loader" />
      <style>{`
        .loader {
          width: 60px;
          aspect-ratio: 2;
          --_g: no-repeat radial-gradient(circle closest-side, hsl(var(--primary)) 90%, transparent);
          background: var(--_g) 0% 50%, var(--_g) 50% 50%, var(--_g) 100% 50%;
          background-size: calc(100% / 3) 50%;
          animation: l3 1s infinite linear;
        }
        @keyframes l3 {
          20% {
            background-position: 0% 0%, 50% 50%, 100% 50%;
          }
          40% {
            background-position: 0% 100%, 50% 0%, 100% 50%;
          }
          60% {
            background-position: 0% 50%, 50% 100%, 100% 0%;
          }
          80% {
            background-position: 0% 50%, 50% 50%, 100% 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
