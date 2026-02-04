'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AchievementData, GoalLevelHistoryRecord, LevelSegment, PeriodLabel } from '@/types/history';

// 1日あたりのピクセル幅
const DAY_WIDTH = 50;

// Goal Typeに応じた色
const GOAL_TYPE_COLORS = {
  gold: '#F59E0B',
  silver: '#94A3B8',
  bronze: '#CD7F32',
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

// 日付からX座標を計算
const getXPosition = (dateStr: string, startDate: Date): number => {
  const eventDate = new Date(dateStr.split('T')[0]);
  const daysDiff = Math.floor((eventDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff * DAY_WIDTH + DAY_WIDTH / 2;
};

// 日数を計算
const getDaysDiff = (startStr: string, endStr: string | null): number => {
  const start = new Date(startStr.split('T')[0]);
  const end = endStr ? new Date(endStr.split('T')[0]) : new Date();
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

// レベルセグメントを計算
const calculateSegments = (
  levelChanges: GoalLevelHistoryRecord[],
  goalType: 'bronze' | 'silver' | 'gold',
  startDate: Date
): LevelSegment[] => {
  const filtered = levelChanges.filter(lc => lc.goal_type === goalType);

  return filtered.map((record) => {
    const startDays = Math.floor(
      (new Date(record.started_at.split('T')[0]).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const durationDays = getDaysDiff(record.started_at, record.ended_at);

    return {
      goalType: record.goal_type,
      level: record.level,
      goalContent: record.goal_content,
      startedAt: record.started_at,
      endedAt: record.ended_at,
      startX: startDays * DAY_WIDTH,
      width: durationDays * DAY_WIDTH,
    };
  });
};

// 期間ラベルを計算（重なり回避のrow割り当て込み）
// レベル変更イベントの「直前のレコードの期間」にラベルを表示する
const calculatePeriodLabels = (
  levelChanges: GoalLevelHistoryRecord[],
  startDate: Date
): PeriodLabel[] => {
  const labels: PeriodLabel[] = [];
  const rowEndPositions: number[] = [];

  // change_reasonがlevel_upまたはlevel_downのイベントを処理
  const events = levelChanges.filter(lc => lc.change_reason !== 'initial');

  for (const event of events) {
    // 同じgoal_typeの直前のレコード（ended_atがnullでないもの）を探す
    const previousRecord = levelChanges.find(
      lc => lc.goal_type === event.goal_type &&
            lc.ended_at !== null &&
            new Date(lc.ended_at).getTime() < new Date(event.started_at).getTime()
    );

    if (!previousRecord || !previousRecord.ended_at) continue;

    // 直前のレコードの期間にラベルを表示
    const startX = getXPosition(previousRecord.started_at, startDate);
    const endX = getXPosition(previousRecord.ended_at, startDate);

    // 空いているrowを探す
    let row = 0;
    while (rowEndPositions[row] !== undefined && rowEndPositions[row] > startX - 50) {
      row++;
    }
    rowEndPositions[row] = endX;

    const label = getEvaluationLabel(event);
    if (label) {
      labels.push({
        id: event.id,
        goalType: event.goal_type,
        label,
        changeReason: event.change_reason as 'level_up' | 'level_down',
        startX,
        endX,
        row,
      });
    }
  }

  return labels;
};

export default function HistoryCharts() {
  const [achievementData, setAchievementData] = useState<AchievementData[]>([]);
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
        const [achievementRes, levelChangesRes] = await Promise.all([
          fetch('/api/history/achievement'),
          fetch('/api/history/level-changes'),
        ]);

        if (!achievementRes.ok) throw new Error('Failed to fetch achievement data');
        if (!levelChangesRes.ok) throw new Error('Failed to fetch level changes');

        const [achievementJson, levelChangesJson] = await Promise.all([
          achievementRes.json(),
          levelChangesRes.json(),
        ]);

        setAchievementData(achievementJson);
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

  // 開始日を計算（メモ化してuseEffectの不要な再実行を防ぐ）
  const startDate = useMemo(() => {
    return levelChanges.length > 0
      ? new Date(levelChanges[0].started_at.split('T')[0])
      : new Date();
  }, [levelChanges]);

  // 終了日（今日）を計算
  const endDate = new Date();
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  // スクロール位置から中央日付を計算
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || levelChanges.length === 0) return;

    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;

    const centerOffset = scrollLeft + containerWidth / 2;
    const dayIndex = Math.floor(centerOffset / DAY_WIDTH);
    const clampedIndex = Math.max(0, Math.min(dayIndex, totalDays - 1));

    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + clampedIndex);
    setCenterLineDate(targetDate.toISOString().split('T')[0]);
  }, [levelChanges, totalDays, startDate]);

  // 初期スクロール位置を今日に設定
  useEffect(() => {
    if (scrollContainerRef.current && levelChanges.length > 0) {
      const today = new Date();
      const todayIndex = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (todayIndex >= 0) {
        const containerWidth = scrollContainerRef.current.clientWidth;
        scrollContainerRef.current.scrollLeft = todayIndex * DAY_WIDTH - containerWidth / 2;
      }
      handleScroll();
    }
  }, [levelChanges, handleScroll, startDate]);

  if (loading) {
    return <div className="text-center py-10">読み込み中...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  if (achievementData.length === 0 && levelChanges.length === 0) {
    return <div className="text-center py-10">まだ学習履歴がありません</div>;
  }

  // グラフ幅を計算
  const chartWidth = Math.max(totalDays * DAY_WIDTH, 800);

  // 達成レベルのカスタムラベル
  const achievementLevelFormatter = (value: number) => {
    if (value === 3) return 'Gold';
    if (value === 2) return 'Silver';
    if (value === 1) return 'Bronze';
    return '未記録';
  };

  // セグメントを計算
  const goldSegments = calculateSegments(levelChanges, 'gold', startDate);
  const silverSegments = calculateSegments(levelChanges, 'silver', startDate);
  const bronzeSegments = calculateSegments(levelChanges, 'bronze', startDate);

  // 期間ラベルを計算
  const periodLabels = calculatePeriodLabels(levelChanges, startDate);

  // 中央縦線の日付に対応する目標を取得
  const getCurrentGoalForType = (goalType: 'bronze' | 'silver' | 'gold') => {
    const centerDate = new Date(centerLineDate);
    const segments = goalType === 'gold' ? goldSegments
      : goalType === 'silver' ? silverSegments
      : bronzeSegments;

    for (const segment of segments) {
      const segmentStart = new Date(segment.startedAt.split('T')[0]);
      const segmentEnd = segment.endedAt ? new Date(segment.endedAt.split('T')[0]) : new Date();
      if (centerDate >= segmentStart && centerDate <= segmentEnd) {
        return { level: segment.level, content: segment.goalContent };
      }
    }
    return { level: 0, content: '(未設定)' };
  };

  const currentGold = getCurrentGoalForType('gold');
  const currentSilver = getCurrentGoalForType('silver');
  const currentBronze = getCurrentGoalForType('bronze');

  // 日付ラベル生成（間隔をあけて表示）
  const dateLabels: { date: string; x: number }[] = [];
  const labelInterval = Math.max(1, Math.floor(totalDays / 15));
  for (let i = 0; i < totalDays; i += labelInterval) {
    const labelDate = new Date(startDate);
    labelDate.setDate(labelDate.getDate() + i);
    dateLabels.push({
      date: `${labelDate.getMonth() + 1}/${labelDate.getDate()}`,
      x: i * DAY_WIDTH + DAY_WIDTH / 2,
    });
  }

  // 最大row数を計算
  const maxRow = periodLabels.length > 0 ? Math.max(...periodLabels.map(p => p.row)) + 1 : 1;
  const periodLabelHeight = maxRow * 28 + 16;

  return (
    <div className="relative flex">
      {/* 左側固定の目標ラベル */}
      <div className="sticky left-0 w-64 bg-white z-20 border-r flex-shrink-0">
        {/* 折れ線グラフのラベルエリア */}
        <div className="h-[220px] flex items-center px-4 border-b bg-gray-50">
          <div>
            <span className="text-lg font-bold text-gray-700">達成状況</span>
            <p className="text-sm text-gray-500">{centerLineDate}</p>
          </div>
        </div>

        {/* 期間ラベルエリア */}
        <div style={{ height: periodLabelHeight }} className="flex items-center px-4 border-b bg-gray-100">
          <span className="text-sm text-gray-500">期間</span>
        </div>

        {/* 日付横軸エリア */}
        <div className="h-[40px] flex items-center px-4 border-b bg-gray-200">
          <span className="text-sm font-medium text-gray-600">日付</span>
        </div>

        {/* Gold ラベル */}
        <div className="h-[60px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-amber-500 font-bold">Gold Lv.{currentGold.level}</span>
            <p className="text-sm text-gray-600 truncate">{currentGold.content}</p>
          </div>
        </div>

        {/* Silver ラベル */}
        <div className="h-[60px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-slate-400 font-bold">Silver Lv.{currentSilver.level}</span>
            <p className="text-sm text-gray-600 truncate">{currentSilver.content}</p>
          </div>
        </div>

        {/* Bronze ラベル */}
        <div className="h-[60px] flex items-center px-4 border-b">
          <div className="overflow-hidden">
            <span className="text-orange-600 font-bold">Bronze Lv.{currentBronze.level}</span>
            <p className="text-sm text-gray-600 truncate">{currentBronze.content}</p>
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
          className="pointer-events-none z-30"
          style={{
            position: 'fixed',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#3B82F6',
            transform: 'translateX(-50%)',
          }}
        />

        <div style={{ width: chartWidth, position: 'relative' }}>
          {/* レベル変更の縦線 */}
          {levelChanges
            .filter(h => h.change_reason !== 'initial')
            .map((event) => {
              const xPos = getXPosition(event.started_at, startDate);
              return (
                <div
                  key={event.id}
                  style={{
                    position: 'absolute',
                    left: xPos,
                    top: 0,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: event.change_reason === 'level_down' ? '#EF4444' : '#22C55E',
                    opacity: 0.6,
                    zIndex: 5,
                  }}
                />
              );
            })}

          {/* 折れ線グラフ: 達成状況の推移（日付軸なし） */}
          <div className="h-[220px] border-b">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={achievementData}>
                <CartesianGrid strokeDasharray="3 3" />
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

          {/* 期間ラベル（<-> 形式） */}
          <div style={{ height: periodLabelHeight }} className="border-b relative bg-gray-50">
            {periodLabels.map((pl) => (
              <div
                key={pl.id}
                className="absolute flex items-center"
                style={{
                  left: pl.startX,
                  top: pl.row * 28 + 8,
                  width: pl.endX - pl.startX,
                }}
              >
                {/* 左矢印 */}
                <span
                  className="text-sm font-bold"
                  style={{
                    color: pl.changeReason === 'level_down' ? '#DC2626' : '#16A34A',
                  }}
                >
                  &lt;
                </span>
                {/* 線とラベル */}
                <div
                  className="flex-1 flex items-center justify-center relative mx-1"
                  style={{ minWidth: 20 }}
                >
                  <div
                    className="absolute w-full"
                    style={{
                      height: '2px',
                      backgroundColor: pl.changeReason === 'level_down' ? '#FCA5A5' : '#86EFAC',
                    }}
                  />
                  <span
                    className="relative px-2 text-xs font-medium rounded whitespace-nowrap"
                    style={{
                      backgroundColor: pl.changeReason === 'level_down' ? '#FEE2E2' : '#DCFCE7',
                      color: pl.changeReason === 'level_down' ? '#DC2626' : '#16A34A',
                    }}
                  >
                    {pl.label}
                  </span>
                </div>
                {/* 右矢印 */}
                <span
                  className="text-sm font-bold"
                  style={{
                    color: pl.changeReason === 'level_down' ? '#DC2626' : '#16A34A',
                  }}
                >
                  &gt;
                </span>
              </div>
            ))}
          </div>

          {/* 日付横軸 */}
          <div className="h-[40px] border-b bg-gray-200 relative flex items-end">
            {dateLabels.map((dl, idx) => (
              <div
                key={idx}
                className="absolute text-xs text-gray-600"
                style={{
                  left: dl.x,
                  transform: 'translateX(-50%) rotate(-45deg)',
                  transformOrigin: 'top left',
                  bottom: 4,
                }}
              >
                {dl.date}
              </div>
            ))}
          </div>

          {/* Gold 横棒グラフ（レベル期間ごと） */}
          <div className="h-[60px] border-b relative">
            {goldSegments.map((segment, idx) => (
              <div
                key={idx}
                className="absolute h-full flex items-center justify-center border-r border-amber-700"
                style={{
                  left: segment.startX,
                  width: segment.width,
                  backgroundColor: GOAL_TYPE_COLORS.gold,
                }}
              >
                <span className="text-white font-bold text-sm drop-shadow">
                  Lv.{segment.level}
                </span>
              </div>
            ))}
          </div>

          {/* Silver 横棒グラフ（レベル期間ごと） */}
          <div className="h-[60px] border-b relative">
            {silverSegments.map((segment, idx) => (
              <div
                key={idx}
                className="absolute h-full flex items-center justify-center border-r border-slate-600"
                style={{
                  left: segment.startX,
                  width: segment.width,
                  backgroundColor: GOAL_TYPE_COLORS.silver,
                }}
              >
                <span className="text-white font-bold text-sm drop-shadow">
                  Lv.{segment.level}
                </span>
              </div>
            ))}
          </div>

          {/* Bronze 横棒グラフ（レベル期間ごと） */}
          <div className="h-[60px] border-b relative">
            {bronzeSegments.map((segment, idx) => (
              <div
                key={idx}
                className="absolute h-full flex items-center justify-center border-r border-orange-800"
                style={{
                  left: segment.startX,
                  width: segment.width,
                  backgroundColor: GOAL_TYPE_COLORS.bronze,
                }}
              >
                <span className="text-white font-bold text-sm drop-shadow">
                  Lv.{segment.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
