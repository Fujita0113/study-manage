'use client';

import { TimelineTodo } from '@/types';
import { TodoCheckbox } from './TodoCheckbox';

interface RoutineTodoSectionProps {
    todos: TimelineTodo[];
    achievedTodoIds: Set<string>;
    onTodoChange: (todoId: string, checked: boolean) => void;
    disabled?: boolean;
}

export function RoutineTodoSection({
    todos,
    achievedTodoIds,
    onTodoChange,
    disabled = false,
}: RoutineTodoSectionProps) {
    return (
        <div className="rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-blue-700">
                    マイルーティン
                </h3>
            </div>

            <div className="space-y-1">
                {todos.map((todo) => (
                    <TodoCheckbox
                        key={todo.id}
                        id={todo.id}
                        content={`[${todo.timeTag}] ${todo.content}`}
                        isChecked={achievedTodoIds.has(todo.id)}
                        onChange={onTodoChange}
                        disabled={disabled}
                    />
                ))}

                {todos.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-2">
                        マイルーティンはまだありません
                    </p>
                )}
            </div>
        </div>
    );
}
