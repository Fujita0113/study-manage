'use client';

// サイドバーコンポーネント

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CalendarIcon, SettingsIcon, EffortIcon } from '../icons';

const navItems = [
  { href: '/', label: 'ホーム', icon: HomeIcon },
  { href: '/calendar', label: 'カレンダー', icon: CalendarIcon },
  { href: '/efforts', label: '工夫管理', icon: EffortIcon },
  { href: '/settings', label: '設定', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* ロゴ */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-slate-800">Pepper Dev Journal</span>
        </div>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                      : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

