'use client';

import { Check } from 'lucide-react';

interface TodoCheckboxProps {
  id: string;
  content: string;
  isChecked: boolean;
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
}

export function TodoCheckbox({
  id,
  content,
  isChecked,
  onChange,
  disabled = false,
}: TodoCheckboxProps) {
  return (
    <label
      className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
        ${isChecked ? 'text-gray-500' : 'text-gray-900'}
      `}
    >
      <div className="flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => !disabled && onChange(id, e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
            ${isChecked
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 bg-white'
            }
          `}
        >
          {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </div>
      <span
        className={`flex-1 text-sm leading-relaxed break-words
          ${isChecked ? 'line-through' : ''}
        `}
      >
        {content}
      </span>
    </label>
  );
}
