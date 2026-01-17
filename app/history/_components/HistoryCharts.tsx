'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { AchievementData, LevelHistoryData, GoalLevelHistoryRecord } from '@/types/history';

// 1日あたりのピクセル幅
const DAY_WIDTH = 50;

// レベルに応じた色を返す
const getLevelColor = (goalType: string, level: number) => {
  const baseColors: Record<string, string[]> = {
    bronze: ['#FDDCAB', '#F5B041', '#CD7F32', '#8B4513'],  // 薄い→濃い
    silver: ['#D5DBDB', '#AEB6BF', '#94A3B8', '#6B7280'],
    gold: ['#FEF3C7', '#FCD34D', '#F59E0B', '#D97706'],
  };
  const colors = baseColors[goalType] || baseColors.bronze;
  return colors[Math.min(level, colors.length) - 1] || colors[0];
};

// レベル変更の評価ラベルを取得
const getEvaluationLabel = (record: GoalLevelHistoryRecord): string => {
  if (record.change_reason === 'level_down') {
    return '不調気味...';
  }
  if (record.change_reason === 'level_up') {
    switch (record.goal_type) {
      case 'gold': return '絶好調！';
      case 'silver': return 'そこそこの調子！';
      case 'bronze': return '習慣継続中！';
    }
  }
  return '';
};

export default function HistoryCharts() {
  const [achievementData, setAchievementData] = useState<AchievementData[]>([]);
  const [levelHistoryData, setLevelHistoryData] = useState<LevelHistoryData[]>([]);
  const [levelChanges, setLevelChanges] = useState<GoalLevelHistoryRecord[]>([]);
  const [centerLineDate, setCenterLineDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 達成状況データ取得
        const achievementRes = await fetch('/api/history/achievement');
        if (!achievementRes.ok) throw new Error('Failed to fetch achievement data');
        const achievementJson = await achievementRes.json();
        setAchievementData(achievementJson);

        // レベル履歴データ取得
        const levelHistoryRes = await fetch('/api/history/level-history');
        if (!levelHistoryRes.ok) throw new Error('Failed to fetch level history data');
        const levelHistoryJson = await levelHistoryRes.json();
        setLevelHistoryData(levelHistoryJson);

        // レベル変更イベント取得
        const levelChangesRes = await fetch('/api/history/level-changes');
        if (!levelChangesRes.ok) throw new Error('Failed to fetch level changes');
        const levelChangesJson = await levelChangesRes.json();
        setLevelChanges(levelChangesJson);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('データの取得に失敗しました');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // スクロール位置から中央日付を計算
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || levelHistoryData.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;

    // 中央位置の日付インデックスを計算
    const centerOffset = scrollLeft + containerWidth / 2;
    const dayIndex = Math.floor(centerOffset / DAY_WIDTH);

    // データ範囲内に収める
    const clampedIndex = Math.max(0, Math.min(dayIndex, levelHistoryData.length - 1));

    if (levelHistoryData[clampedIndex]) {
      setCenterLineDate(levelHistoryData[clampedIndex].date);
    }
  }, [levelHistoryData]);

  // 初期スクロール位置を今日に設定
  useEffect(() => {
    if (scrollContainerRef.current && levelHistoryData.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todayIndex = levelHistoryData.findIndex(d => d.date === today);

      if (todayIndex >= 0) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = todayIndex * DAY_WIDTH - containerWidth / 2;
      } else {
        // 今日のデータがない場合は最後のデータを中央に
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft =
          levelHistoryData.length * DAY_WIDTH - containerWidth / 2;
      }
      handleScroll();
    }
  }, [levelHistoryData, handleScroll]);

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (achievementData.length === 0 && levelHistoryData.length === 0) {
    return <div className="text-center py-10">まだ学習履歴がありません</div>;
  }

  // グラフ幅を計算
  const chartWidth = Math.max(levelHistoryData.length * DAY_WIDTH, 800);

  // 開始日を取得
  const startDate = levelHistoryData.length > 0 ? levelHistoryData[0].date : '';

  // 達成レベルのカスタムラベル
  const achievementLevelFormatter = (value: number) => {
    if (value === 3) return 'Gold';
    if (value === 2) return 'Silver';
    if (value === 1) return 'Bronze';
    return '未記録';
  };

  // 中央縦線の日付に対応する目標を取得
  const currentGoalData = levelHistoryData.find(d => d.date === centerLineDate) || {
    bronze: 0,
    silver: 0,
    gold: 0,
    bronzeContent: '',
    silverContent: '',
    goldContent: '',
  };

  // レベル変更イベント（initialを除く）のフィルタリング
  const levelChangeEvents = levelChanges.filter(h => h.change_reason !== 'initial');

  // 日付からX座標を計算する関数
  const getXPosition = (dateStr: string): number => {
    const eventDate = new Date(dateStr.split('T')[0]);
    const start = new Date(startDate);
    const daysDiff = Math.floor((eventDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff * DAY_WIDTH + DAY_WIDTH / 2;
  };

  return (
    <div className="relative flex">
      {/* 左側固定の目標ラベル */}
      <div className="sticky left-0 w-64 bg-white z-20 border-r flex-shrink-0">
        {/* 折れ線グラフのラベルエリア */}
        <div className="h-[340px] flex items-center px-4 border-b bg-gray-50">
          <div>
            <span className="text-lg font-bold text-gray-700">達成状況</span>
            <p className="text-sm text-gray-500">{centerLineDate}</p>
          </div>
        </div>

        {/* Gold ラベル */}
        <div className="h-[80px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-amber-500 font-bold">Gold Lv.{currentGoalData.gold}</span>
            <p className="text-sm text-gray-600 truncate">{currentGoalData.goldContent || '(未設定)'}</p>
          </div>
        </div>

        {/* Silver ラベル */}
        <div className="h-[80px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-slate-400 font-bold">Silver Lv.{currentGoalData.silver}</span>
            <p className="text-sm text-gray-600 truncate">{currentGoalData.silverContent || '(未設定)'}</p>
          </div>
        </div>

        {/* Bronze ラベル */}
        <div className="h-[80px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-orange-600 font-bold">Bronze Lv.{currentGoalData.bronze}</span>
            <p className="text-sm text-gray-600 truncate">{currentGoalData.bronzeContent || '(未設定)'}</p>
          </div>
        </div>
      </div>

      {/* スクロール可能なグラフエリア */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto relative"
        onScroll={handleScroll}
      >
        {/* 中央縦線 */}
        <div
          className="pointer-events-none z-10"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#3B82F6',
            transform: 'translateX(-50%)'
          }}
        />

        <div style={{ width: chartWidth, minHeight: '580px', position: 'relative' }}>
          {/* レベル変更の縦線とラベル */}
          {levelChangeEvents.map((event, index) => {
            const xPos = getXPosition(event.started_at);
            const label = getEvaluationLabel(event);
            // 上下交互に配置
            const isTop = index % 2 === 0;

            return (
              <div key={event.id} style={{ position: 'absolute', left: xPos, top: 0, bottom: 0 }}>
                {/* 縦線 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 40,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: event.change_reason === 'level_down' ? '#EF4444' : '#22C55E',
                    opacity: 0.6
                  }}
                />
                {/* ラベル */}
                {label && (
                  <div
                    className="absolute whitespace-nowrap text-xs px-1 rounded"
                    style={{
                      top: isTop ? '8px' : '24px',
                      left: '4px',
                      backgroundColor: event.change_reason === 'level_down' ? '#FEE2E2' : '#DCFCE7',
                      color: event.change_reason === 'level_down' ? '#DC2626' : '#16A34A',
                    }}
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}

          {/* ラベルエリア（折れ線グラフの上部） */}
          <div className="h-[40px] border-b" />

          {/* 折れ線グラフ: 達成状況の推移 */}
          <div className="h-[300px] border-b">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={achievementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(achievementData.length / 15)}
                />
                <YAxis
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={achievementLevelFormatter}
                  width={60}
                />
                <Tooltip
                  labelFormatter={(label) => `日付: ${label}`}
                  formatter={(value) => [achievementLevelFormatter(typeof value === 'number' ? value : 0), '達成レベル']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="level"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="達成レベル"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Gold 横棒グラフ */}
          <div className="h-[80px] border-b">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelHistoryData} layout="vertical" barCategoryGap={0}>
                <XAxis type="number" hide domain={[0, levelHistoryData.length]} />
                <YAxis type="category" hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as LevelHistoryData;
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg text-sm">
                          <p className="font-semibold">{data.date}</p>
                          <p className="text-amber-500">Gold Lv.{data.gold}</p>
                          <p className="text-gray-600">{data.goldContent}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="gold" name="Gold">
                  {levelHistoryData.map((entry, index) => (
                    <Cell key={index} fill={getLevelColor('gold', entry.gold)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Silver 横棒グラフ */}
          <div className="h-[80px] border-b">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelHistoryData} layout="vertical" barCategoryGap={0}>
                <XAxis type="number" hide domain={[0, levelHistoryData.length]} />
                <YAxis type="category" hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as LevelHistoryData;
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg text-sm">
                          <p className="font-semibold">{data.date}</p>
                          <p className="text-slate-500">Silver Lv.{data.silver}</p>
                          <p className="text-gray-600">{data.silverContent}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="silver" name="Silver">
                  {levelHistoryData.map((entry, index) => (
                    <Cell key={index} fill={getLevelColor('silver', entry.silver)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bronze 横棒グラフ */}
          <div className="h-[80px] border-b">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelHistoryData} layout="vertical" barCategoryGap={0}>
                <XAxis type="number" hide domain={[0, levelHistoryData.length]} />
                <YAxis type="category" hide />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as LevelHistoryData;
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg text-sm">
                          <p className="font-semibold">{data.date}</p>
                          <p className="text-orange-600">Bronze Lv.{data.bronze}</p>
                          <p className="text-gray-600">{data.bronzeContent}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bronze" name="Bronze">
                  {levelHistoryData.map((entry, index) => (
                    <Cell key={index} fill={getLevelColor('bronze', entry.bronze)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
