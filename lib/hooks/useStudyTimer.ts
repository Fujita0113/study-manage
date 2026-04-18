import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_SAVE_INTERVAL = 30; // localStorage書き込み間隔（秒）

/**
 * 学習時間を計測するためのカスタムフック
 * localStorageを用いてブラウザを閉じても計測が続くように設計されている
 *
 * @param enabled - falseの場合タイマーを停止する（過去日の記録閲覧時など）
 */
export function useStudyTimer(enabled: boolean = true) {
    const [seconds, setSeconds] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lastHeartbeatRef = useRef<number>(Date.now());
    const secondsSinceLastSaveRef = useRef(0);

    const getStorageKey = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return `study-timer-${today}`;
    }, []);

    // 初期化: localStorageから以前のセッション情報を読み込む
    useEffect(() => {
        const key = getStorageKey();
        const storedData = localStorage.getItem(key);

        if (storedData) {
            const { accumulatedSeconds } = JSON.parse(storedData);
            setSeconds(accumulatedSeconds);
        }

        // 他の日のデータをクリーンアップ
        for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey?.startsWith('study-timer-') && storageKey !== key) {
                localStorage.removeItem(storageKey);
            }
        }
    }, [getStorageKey]);

    // 計測ロジック（enabled時のみ動作）
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const startTimer = () => {
            timerRef.current = setInterval(() => {
                const now = Date.now();
                const diff = now - lastHeartbeatRef.current;

                // 5秒以上の間隔が空いた場合は、PCスリープやブラウザ停止とみなして加算しない
                if (diff < 5000) {
                    setSeconds(prev => {
                        const next = prev + Math.floor(diff / 1000);

                        // 30秒ごとにlocalStorageへ保存（毎秒の書き込みを回避）
                        secondsSinceLastSaveRef.current++;
                        if (secondsSinceLastSaveRef.current >= STORAGE_SAVE_INTERVAL) {
                            localStorage.setItem(getStorageKey(), JSON.stringify({
                                accumulatedSeconds: next,
                                lastHeartbeat: now
                            }));
                            secondsSinceLastSaveRef.current = 0;
                        }

                        return next;
                    });
                }

                lastHeartbeatRef.current = now;
            }, 1000);
        };

        startTimer();

        // タブの表示状態が変わった時の挙動
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // 隠れた時はHeartbeatを更新して待機
                lastHeartbeatRef.current = Date.now();
                // タブが隠れる時にlocalStorageへ保存（データロスト防止）
                setSeconds(prev => {
                    localStorage.setItem(getStorageKey(), JSON.stringify({
                        accumulatedSeconds: prev,
                        lastHeartbeat: Date.now()
                    }));
                    return prev;
                });
            } else {
                // 戻ってきた時はその時点の時刻をHeartbeatにセットしてカウント再開（隙間は無視）
                lastHeartbeatRef.current = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            // クリーンアップ時にもlocalStorageへ保存
            setSeconds(prev => {
                localStorage.setItem(getStorageKey(), JSON.stringify({
                    accumulatedSeconds: prev,
                    lastHeartbeat: Date.now()
                }));
                return prev;
            });
        };
    }, [getStorageKey, enabled]);

    // DBの既存データを初期値としてセットしたい場合の関数
    const setInitialSeconds = useCallback((initialSeconds: number) => {
        setSeconds(prev => {
            // 既にlocalStorageにある値の方が大きい（未保存の作業がある）場合はそれを優先
            if (prev > initialSeconds) return prev;

            localStorage.setItem(getStorageKey(), JSON.stringify({
                accumulatedSeconds: initialSeconds,
                lastHeartbeat: Date.now()
            }));
            return initialSeconds;
        });
    }, [getStorageKey]);

    // フォーマット用
    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
    };

    return {
        seconds,
        formattedTime: formatTime(seconds),
        setInitialSeconds
    };
}
