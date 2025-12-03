import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative">
        <svg 
          className="logo-animated" 
          width={120} 
          height={120} 
          viewBox="0 0 512 512" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="512" height="512" fill="none"/>
          <path 
            d="M157.666 409.334L157.666 353.959L157.666 324.042L157.666 268.667L157.666 238.75L157.666 183.375L157.666 153.458L157.666 102.666L213.041 102.666L213.041 153.458L213.041 183.375L213.041 238.75L213.041 268.667L213.041 324.042L213.041 353.959L213.041 409.334L157.666 409.334ZM102.291 409.334L102.291 268.667L102.291 153.458L102.291 102.666L157.666 102.666L157.666 153.458L157.666 268.667L157.666 409.334L102.291 409.334Z" 
            className="logo-path"
          />
          <path 
            d="M298.792 409.334L298.792 353.959L298.792 324.042L298.792 268.667L298.792 238.75L298.792 183.375L298.792 153.458L298.792 102.666L354.167 102.666L354.167 153.458L354.167 183.375L354.167 238.75L354.167 268.667L354.167 324.042L354.167 353.959L354.167 409.334L298.792 409.334ZM243.417 409.334L243.417 268.667L243.417 153.458L243.417 102.666L298.792 102.666L298.792 153.458L298.792 268.667L298.792 409.334L243.417 409.334Z" 
            className="logo-path"
          />
          <path 
            d="M409.542 268.667L409.542 153.458L409.542 102.666L354.167 102.666L354.167 153.458L354.167 268.667L409.542 268.667Z" 
            className="logo-path"
          />
        </svg>
      </div>
      <style>{`
        .logo-animated {
          overflow: visible;
        }

        .logo-path {
          fill: none;
          stroke: currentColor;
          stroke-width: 8px;
          stroke-dasharray: 20px;
          stroke-dashoffset: 0px;
          animation: load-stroke 15s infinite linear;
        }

        @keyframes load-stroke {
          from {
            stroke-dashoffset: 0px;
          }
          to {
            stroke-dashoffset: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
