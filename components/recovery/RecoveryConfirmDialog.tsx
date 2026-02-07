'use client';

interface RecoveryConfirmDialogProps {
  isOpen: boolean;
  recoveryGoal: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RecoveryConfirmDialog({
  isOpen,
  recoveryGoal,
  onConfirm,
  onCancel,
  isLoading
}: RecoveryConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onCancel}
      />

      {/* ダイアログ本体 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          リカバリーモードを起動しますか？
        </h2>

        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-pink-700 mb-2">あなたの目標:</p>
          <p className="text-lg font-medium text-pink-900">{recoveryGoal}</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
          <p className="text-sm text-yellow-700">
            起動後はキャンセルできません
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            やめる
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '起動中...' : '起動する'}
          </button>
        </div>
      </div>
    </div>
  );
}
