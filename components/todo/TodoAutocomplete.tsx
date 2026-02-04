'use client';

import { useState, useEffect, useRef } from 'react';
import { OtherTodo } from '@/types';

interface TodoAutocompleteProps {
  onSelect: (content: string) => void;
  onCancel: () => void;
  placeholder?: string;
}

export function TodoAutocomplete({
  onSelect,
  onCancel,
  placeholder = 'TODOを入力...',
}: TodoAutocompleteProps) {
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<OtherTodo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 入力フィールドにフォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // クリック外を検出して閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (value.trim()) {
          onSelect(value.trim());
        } else {
          onCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, onSelect, onCancel]);

  // 検索
  useEffect(() => {
    const searchTodos = async () => {
      if (value.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/other-todos/search?q=${encodeURIComponent(value.trim())}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        }
      } catch (error) {
        console.error('Failed to search todos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchTodos, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      onSelect(value.trim());
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleSelectSuggestion = (suggestion: OtherTodo) => {
    onSelect(suggestion.content);
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {suggestion.content}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
