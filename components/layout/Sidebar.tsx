'use client';

// サイドバーコンポーネント

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CalendarIcon, SettingsIcon, HistoryIcon } from '../icons';

const navItems = [
  { href: '/', label: 'ホーム', icon: HomeIcon },
  { href: '/record', label: '記録', icon: HomeIcon }, // TODO: RecordIconに変更
  { href: '/calendar', label: 'カレンダー', icon: CalendarIcon },
  { href: '/history', label: '目標変遷', icon: HistoryIcon },
  { href: '/settings', label: '設定', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-60 bg-[#F7F7F5] flex flex-col border-r border-[#E9E9E7]">
      {/* ロゴ */}
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-slate-800">Pepper Dev Journal</span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm
                    ${isActive
                      ? 'bg-[#EFEFED] text-[#37352F] font-semibold'
                      : 'text-slate-600 hover:bg-[#EFEFED] hover:text-[#37352F]'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#37352F]' : 'text-slate-500'}`} />
                  <span className={`${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

