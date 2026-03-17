'use client';

import { GoalLevel, GoalTodo } from '@/types';
import { TodoCheckbox } from './TodoCheckbox';

interface TodoLevelSectionProps {
  level: GoalLevel;
  todos: GoalTodo[];
  achievedTodoIds: Set<string>;
  onTodoChange: (todoId: string, checked: boolean) => void;
  onToggleLevel: (level: GoalLevel, checked: boolean) => void;
  disabled?: boolean;
}

const levelConfig: Record<GoalLevel, { label: string; color: string; bgColor: string }> = {
  bronze: {
    label: 'Bronze',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  silver: {
    label: 'Silver',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
  gold: {
    label: 'Gold',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
};

export function TodoLevelSection({
  level,
  todos,
  achievedTodoIds,
  onTodoChange,
  onToggleLevel,
  disabled = false,
}: TodoLevelSectionProps) {
  const config = levelConfig[level];
  const achievedCount = todos.filter(t => achievedTodoIds.has(t.id)).length;
  const allAchieved = achievedCount === todos.length && todos.length > 0;

  if (todos.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-lg ${config.bgColor} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${config.color}`}>
          {config.label}
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allAchieved}
            onChange={(e) => onToggleLevel(level, e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            aria-label={`${config.label}を一括チェック`}
          />
          <span className={`text-sm ${allAchieved ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
            {achievedCount}/{todos.length}
          </span>
        </div>
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
      </div>
    </div>
  );
}
