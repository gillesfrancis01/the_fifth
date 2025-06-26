import React from 'react';

type FlatButtonProps = {
  children: React.ReactNode;
  className?: string;
  rounded?: boolean;
  onClick?: () => void;
  borderColor?: string; // Optional custom border color
  border?: number
};

const FlatButton = ({
  children,
  className = '',
  rounded = false,
  onClick,
  borderColor,
  
}: FlatButtonProps) => {
  const roundedClass = rounded ? 'rounded-full' : 'rounded-none';

  const borderClass = borderColor
    ? `border-2 border-${borderColor}`
    : 'border-2 border-transparent bg-main';

  return (
    <button
      onClick={onClick}
      className={`relative inline-block p-[2px]  ${roundedClass} ${borderClass} ${className}`}
    >
      <div
        className={`flex items-center justify-center w-full h-full bg-black ${roundedClass} px-2 py-2`}
      >
        {children}
      </div>
    </button>
  );
};

export default FlatButton;
