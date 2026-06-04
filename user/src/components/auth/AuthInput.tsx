import React from 'react';

const inputBase =
  'w-full pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition duration-200';

interface AuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
}

export function AuthInput({
  label,
  leftIcon,
  rightElement,
  id,
  error,
  ...props
}: AuthInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-gray-800 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          id={id}
          className={`${inputBase} ${leftIcon ? 'pl-11' : 'pl-4'} ${rightElement ? 'pr-11' : ''} ${error ? '!border-red-400 focus:!border-red-500 focus:!ring-red-500/20' : ''}`}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600">
            {rightElement}
          </span>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
