'use client';

import Link from 'next/link';

interface YesterdayRecordBannerProps {
  yesterdayDate: string; // YYYY-MM-DD形式
}

export function YesterdayRecordBanner({ yesterdayDate }: YesterdayRecordBannerProps) {
  return (
    <div className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg shadow-2xl p-4 max-w-sm animate-slide-up">
      {/* メッセージ */}
      <div className="mb-3">
        <p className="text-sm font-medium leading-relaxed">
          昨日の日報が作成されていません。日報を作成しますか？
        </p>
      </div>

      {/* アクションボタン */}
      <Link
        href={`/record?date=${yesterdayDate}`}
        className="block w-full bg-white text-center py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors text-slate-700"
      >
        昨日の日報を作成する
      </Link>
    </div>
  );
}
