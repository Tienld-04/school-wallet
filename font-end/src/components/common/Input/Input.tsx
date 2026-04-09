import React, { useState } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  maxLength,
  disabled = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-slate-400 text-lg pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={name}
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          autoComplete={isPassword ? 'current-password' : 'off'}
          className={`w-full py-3 px-4 bg-white border-[1.5px] rounded-[10px] text-slate-800 text-[0.9375rem] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/12 disabled:bg-slate-100 disabled:cursor-not-allowed ${icon ? 'pl-11' : ''} ${error ? 'border-red-500 focus:ring-red-500/12' : 'border-slate-200'}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 bg-transparent border-none cursor-pointer text-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        )}
      </div>
      {error && (
        <span className="text-[0.8125rem] text-red-500 font-medium">{error}</span>
      )}
    </div>
  );
};

export default Input;
