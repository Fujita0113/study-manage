# 実装計画：ホーム画面の当日カードクリック時に編集画面へ遷移

## 作業の目的と概要

ホーム画面のデイリーレポートカード一覧において、**当日のカード**をクリックした場合に
「日詳細画面（読み取り専用）」ではなく「記録画面（編集モード）」へ遷移するよう変更する。

過去日のカードは引き続き `/day/[date]`（読み取り専用）へ遷移する。

---

## 使用する主要モジュールとバージョン

| モジュール | バージョン | 用途 |
|------------|-----------|------|
| next | 16.1.1 | App Router / Link コンポーネント |
| react | 19.2.3 | - |
| typescript | ^5 | - |

依存関係の追加・変更なし。既存のモジュールのみ使用する。

---

## 変更が必要なファイル

| ファイル | 変更内容 |
|----------|----------|
| `app/page.tsx` | カードの `href` を、当日は `/record`、過去日は `/day/${date}` に出し分ける |

**変更不要なファイル:**
- `app/record/page.tsx` — 変更なし（date パラメータ有りの場合も対応済み）
- `app/record/RecordPageClient.tsx` — 変更なし（既に日付に応じた編集モード判定が実装済み）
- `app/day/[date]/page.tsx` — 変更なし

---

## 実装手順

### Step 1: `app/page.tsx` のカードリンクを修正

**現在の実装（193〜196行目付近）:**

```tsx
<Link
  key={card.date}
  href={`/day/${card.date}`}
  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
>
```

**変更後:**

```tsx
<Link
  key={card.date}
  href={card.date === today ? `/record` : `/day/${card.date}`}
  className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
>
```

- `today` 変数はすでに64行目付近で `const today = formatDate(new Date());` として定義済み
- 当日 → `/record`（パラメータなし、デフォルトで今日の記録を開く）
- 過去日 → `/day/${card.date}`（読み取り専用の詳細画面）

---

## 想定される影響範囲

- **ホーム画面のカード遷移のみ変更**。他の画面・機能への影響なし
- 記録画面（`/record`）は既に「既存記録がある場合は編集モードで開く」動作が実装済み
  - `RecordPageClient.tsx` の83〜160行目で、`GET /api/daily-records?date=today` を呼び出し、
    データがあれば `setIsEditMode(true)` に切り替える処理が存在する
- 記録が未作成の当日のカード（空のカード）をクリックした場合 → 新規作成モードで記録画面が開く

---

## テスト方針

手動確認で以下をチェックする：

1. **当日に記録がある場合**: 当日カードをクリック → `/record` に遷移し、編集モードで既存データが表示されること
2. **当日に記録がない場合**: 当日カードをクリック → `/record` に遷移し、新規作成モードで開くこと
3. **過去日のカード**: クリック → `/day/[date]` に遷移し、読み取り専用の詳細画面が表示されること
4. ビルドが通ること（`npm run build`）
