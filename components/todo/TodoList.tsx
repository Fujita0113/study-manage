'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface TodoItem {
  id?: string;
  content: string;
}

interface TodoListProps {
  todos: TodoItem[];
  onChange: (todos: TodoItem[]) => void;
  maxItems?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function TodoList({
  todos,
  onChange,
  maxItems = 10,
  placeholder = 'TODOを入力...',
  disabled = false,
}: TodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const handleAddTodo = () => {
    if (newTodo.trim() && todos.length < maxItems) {
      onChange([...todos, { content: newTodo.trim() }]);
      setNewTodo('');
    }
  };

  const handleRemoveTodo = (index: number) => {
    const newTodos = todos.filter((_, i) => i !== index);
    onChange(newTodos);
  };

  const handleUpdateTodo = (index: number, content: string) => {
    const newTodos = [...todos];
    newTodos[index] = { ...newTodos[index], content };
    onChange(newTodos);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTodo();
    }
  };

  return (
    <div className="space-y-2">
      {/* 既存のTODOリスト */}
      {todos.map((todo, index) => (
        <div
          key={todo.id || `new-${index}`}
          className="flex items-center gap-2 group"
        >
          <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
          <input
            type="text"
            value={todo.content}
            onChange={(e) => handleUpdateTodo(index, e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleRemoveTodo(index)}
            disabled={disabled}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* 新規追加フィールド */}
      {todos.length < maxItems && !disabled && (
        <div className="flex items-center gap-2">
          <div className="w-4" /> {/* スペーサー */}
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleAddTodo}
            disabled={!newTodo.trim()}
            className="p-2 text-gray-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:hover:text-gray-400"
            aria-label="追加"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 上限メッセージ */}
      {todos.length >= maxItems && (
        <p className="text-xs text-gray-500 text-center">
          TODOは最大{maxItems}件までです
        </p>
      )}
    </div>
  );
}
