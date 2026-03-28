'use client';

import { useState } from 'react';

type TextInputVariant = 'default' | 'focused' | 'filled' | 'error' | 'disabled';

interface TextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  variant?: TextInputVariant;
  errorText?: string;
  type?: string;
  name?: string;
  id?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export function TextInput({
  label = 'Email address',
  placeholder = 'archer@opac.ie',
  value,
  defaultValue,
  variant = 'default',
  errorText = 'This field is required',
  type = 'text',
  name,
  id,
  onChange,
  className = '',
}: TextInputProps) {
  const [focused, setFocused] = useState(false);

  const isDisabled = variant === 'disabled';
  const isError = variant === 'error';
  const isFocused = variant === 'focused' || (variant === 'default' && focused);

  const borderClass = isError
    ? 'border-2 border-opac-error'
    : isFocused
    ? 'border-2 border-opac-green'
    : 'border border-opac-border';

  const bgClass = isDisabled ? 'bg-opac-surface' : 'bg-opac-bg';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`font-body text-[13px] font-semibold leading-none ${
            isDisabled ? 'text-opac-ink-30' : 'text-opac-ink'
          }`}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={type}
          disabled={isDisabled}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full h-[52px] rounded-[8px] ${bgClass} ${borderClass} px-4 font-body text-[15px] ${
            isDisabled ? 'text-opac-ink-30 cursor-not-allowed' : 'text-opac-ink'
          } outline-none transition-[border] duration-150 placeholder:text-opac-ink-30`}
        />
        {isError && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7.5" stroke="#EF4444" />
              <path d="M8 4.5v4M8 10.5v1" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      {isError && (
        <span className="font-body text-[12px] text-opac-error">{errorText}</span>
      )}
    </div>
  );
}
