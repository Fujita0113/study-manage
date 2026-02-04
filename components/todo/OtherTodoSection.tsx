'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { OtherTodo } from '@/types';
import { TodoCheckbox } from './TodoCheckbox';
import { TodoAutocomplete } from './TodoAutocomplete';

interface OtherTodoSectionProps {
  todos: OtherTodo[];
  achievedTodoIds: Set<string>;
  onTodoChange: (todoId: string, checked: boolean) => void;
  onAddTodo: (content: string) => void;
  disabled?: boolean;
}

export function OtherTodoSection({
  todos,
  achievedTodoIds,
  onTodoChange,
  onAddTodo,
  disabled = false,
}: OtherTodoSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTodo = (content: string) => {
    onAddTodo(content);
    setIsAdding(false);
  };

  return (
    <div className="rounded-lg bg-blue-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-blue-700">
          その他
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            disabled={disabled}
          >
            <Plus className="w-4 h-4" />
            追加
          </button>
        )}
      </div>

      <div className="space-y-1">
        {todos.map((todo) => (
          <TodoCheckbox
            key={todo.id}
            id={todo.id}
            content={todo.content}
            isChecked={achievedTodoIds.has(todo.id)}
            onChange={onTodoChange}
            disabled={disabled}
          />
        ))}

        {isAdding && (
          <div className="mt-2">
            <TodoAutocomplete
              onSelect={handleAddTodo}
              onCancel={() => setIsAdding(false)}
              placeholder="TODOを入力..."
            />
          </div>
        )}

        {todos.length === 0 && !isAdding && (
          <p className="text-sm text-gray-500 text-center py-2">
            その他のTODOはまだありません
          </p>
        )}
      </div>
    </div>
  );
}
