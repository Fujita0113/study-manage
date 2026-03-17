'use client';

interface GoldAlert {
    todoContent: string;
    weeksNotAchieved: number;
    type: 'not_achieved';
}

interface GoldValidityAlertsProps {
    alerts: GoldAlert[];
}

export function GoldValidityAlerts({ alerts }: GoldValidityAlertsProps) {
    if (alerts.length === 0) {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    Gold目標は正常に機能しています。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {alerts.map((alert, index) => (
                <div
                    key={index}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-lg"
                >
                    <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">⚠️</span>
                        <div>
                            <p className="text-sm font-semibold text-amber-800 mb-1">
                                長期未達成の目標があります
                            </p>
                            <p className="text-sm text-amber-700">
                                「{alert.todoContent}」は
                                <span className="font-bold">{alert.weeksNotAchieved}週間</span>
                                連続で達成されていません。目標を見直しますか？
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
