# 目標編集画面のアクセス制限実装計画

## 現状分析

### アクセス経路
現在、目標編集画面（`/goals`）へのアクセス経路は以下の通り：

1. **提案バナー経由**（[components/SuggestionBanner.tsx:29](components/SuggestionBanner.tsx#L29)）
   - `/goals?edit=bronze` - Bronze 14日連続達成時
   - `/goals?edit=silver` - Silver 14日連続達成時
   - `/goals?edit=gold` - Gold 14日連続達成時
   - `/goals?edit=all` - レベルダウン提案時

2. **直接URL入力**
   - ユーザーがブラウザのアドレスバーに `/goals` を直接入力することで、制限なくアクセス可能

3. **サイドバーのメニュー**
   - 現在、サイドバー（[components/layout/Sidebar.tsx](components/layout/Sidebar.tsx)）には目標編集画面へのリンクは存在しない

### 問題点

**直接URL入力により、提案バナーなしでもアクセス可能**である点が、新しい要件（「提案バナー経由でのみアクセス可能」）と矛盾しています。

---

## 実装計画

### 1. アクセス制御ロジックの追加

#### 1.1 データモデルの確認・拡張

現在のデータモデルに以下の情報が必要：
- 現在のストリーク日数（連続達成日数）
- 直近7日間の達成状況

**確認事項:**
- [lib/db.ts](lib/db.ts) でストリーク日数を計算する関数の有無を確認
- [lib/store.tsx](lib/store.tsx) でストリーク状態を管理しているか確認

#### 1.2 アクセス条件の判定関数を作成

[lib/utils.ts](lib/utils.ts) に新しい関数を追加：

```typescript
/**
 * 目標編集画面へのアクセスが許可されているかを判定
 * @returns { canAccess: boolean, allowedEditParam: string | null }
 */
export function canAccessGoalEditPage(
  currentStreak: number,
  recentRecords: DailyRecord[]
): { canAccess: boolean; allowedEditParam: string | null } {
  // 14日連続達成の判定
  if (currentStreak >= 14) {
    // どのレベルで達成したかを判定
    // Bronze連続達成 → 'bronze'
    // Silver連続達成 → 'silver'
    // Gold連続達成 → 'gold'
    return { canAccess: true, allowedEditParam: 'gold' }; // 実装時に詳細ロジックを追加
  }

  // 直近7日間のうち4日以上Bronze未達の判定
  const last7Days = recentRecords.slice(0, 7);
  const bronzeFailCount = last7Days.filter(r => !r.level || r.level === 'none').length;

  if (bronzeFailCount >= 4) {
    return { canAccess: true, allowedEditParam: 'all' };
  }

  // 条件を満たしていない
  return { canAccess: false, allowedEditParam: null };
}
```

### 2. 目標編集画面にアクセス制御を実装

#### 2.1 [app/goals/page.tsx](app/goals/page.tsx) を修正

**変更箇所:**

1. **アクセス制御チェックの追加（11行目付近）**
   ```typescript
   const searchParams = useSearchParams();
   const editParam = searchParams.get('edit');

   // アクセス制御ロジックを追加
   const { canAccess, allowedEditParam } = canAccessGoalEditPage(currentStreak, recentRecords);

   // アクセス権限がない、またはeditパラメータが不正な場合はリダイレクト
   useEffect(() => {
     if (!canAccess || (editParam && editParam !== allowedEditParam)) {
       router.push('/');
     }
   }, [canAccess, allowedEditParam, editParam, router]);
   ```

2. **editパラメータの必須化（14行目付近）**
   - 現在のロジック（23-25行目）では、`editParam` がない場合も全て編集可能
   - これを変更し、`editParam` が必須となるようにする

3. **不正アクセス時のUI表示**
   - アクセス権限がない場合、「アクセスできません」というメッセージを表示
   - 自動的にホーム画面へリダイレクト

#### 2.2 修正後の期待動作

| アクセス方法 | 現在の動作 | 修正後の動作 |
|---|---|---|
| `/goals` (直接入力) | 全て編集可能 | ホーム画面へリダイレクト |
| `/goals?edit=bronze` (条件未達成) | Bronze以上編集可能 | ホーム画面へリダイレクト |
| `/goals?edit=bronze` (Bronze 14日達成) | Bronze以上編集可能 | Bronze目標のみ編集可能（変更なし） |
| `/goals?edit=all` (条件未達成) | 全て編集可能 | ホーム画面へリダイレクト |
| `/goals?edit=all` (7日中4日未達) | 全て編集可能 | 全て編集可能（変更なし） |

### 3. 提案バナーのロジックは維持

[components/SuggestionBanner.tsx](components/SuggestionBanner.tsx) は変更不要です。提案バナーは既に正しい `edit` パラメータを生成しています。

---

## 実装手順

1. **[lib/db.ts](lib/db.ts) と [lib/store.tsx](lib/store.tsx) を確認**
   - ストリーク日数の計算方法を確認
   - 必要に応じて、ストリーク情報を取得する関数を追加

2. **[lib/utils.ts](lib/utils.ts) に `canAccessGoalEditPage` 関数を追加**
   - アクセス条件の判定ロジックを実装
   - 単体テストで動作を確認

3. **[app/goals/page.tsx](app/goals/page.tsx) を修正**
   - アクセス制御ロジックを追加
   - editパラメータの必須化
   - 不正アクセス時のリダイレクト処理

4. **動作確認**
   - 直接URL入力でアクセスできないことを確認
   - 提案バナー経由でのみアクセスできることを確認
   - 各条件（14日連続、7日中4日未達）での動作を確認

---

## 注意事項

- この変更により、ユーザーは条件を満たさない限り目標編集画面にアクセスできなくなります
- 初回起動時など、まだ目標が設定されていない場合の処理を別途検討する必要があります
- ブラウザの戻るボタンやブックマークからの直接アクセスも制限されます
