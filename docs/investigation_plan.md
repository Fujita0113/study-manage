# /record 画面パフォーマンス調査・修正計画

## 1. 調査結果
`/record` 画面の読み込みが遅い（重い）主な原因は、**クライアントサイド (`RecordPageClient.tsx`) におけるAPIのウォーターフォール（直列実行）** です。

現在、`useEffect` 内で以下の順にAPIを `await` してデータ取得しています。

1. `GET /api/daily-records?date=...` (日報データの有無チェック)
2. 1で日報が存在した場合、`GET /api/daily-records/[id]/todos` (達成済TODOの取得)
3. `GET /api/goals/todos` (目標TODOリストの取得)
4. `GET /api/other-todos` (その他TODOリストの取得)

特に 3 と 4 の取得は、1 と 2 の結果に依存しないため、これらを直列で待機する必要はありません。これらが順次実行されることで、通信時間が合算され、画面の初期表示（ローディング解除）までに時間がかかっています。

## 2. 修正計画
以下の手順で `RecordPageClient.tsx` のデータ取得処理を並列化（Parallelization）します。

1. **非依存APIの並列化**
   `Promise.all` を用い、依存関係のないAPI呼び出しを同時に実行するように修正します。
   - `fetch('/api/goals/todos')`
   - `fetch('/api/other-todos')`
   - `fetch('/api/daily-records?date=...')`
   
   上記3つを同時に `Promise.all` で発行します。

2. **依存APIのチェイン**
   `daily-records` のレスポンスにより、既存のレコードが存在する場合は、その情報を用いて `fetch('/api/daily-records/[id]/todos')` を実行します。

3. **ローディング制御**
   すべての非同期処理が完了したタイミングで `setLoading(false)` を呼び出します。

## 3. 実装手順
- `app/record/RecordPageClient.tsx` の `loadData` 関数内を修正。
- 修正後、ビルドエラーがないか確認。
- 提供されているテストアカウントを使用し、ローカルでE2Eテスト（Playwright）を実行して、既存のテストが壊れていないか、動作が問題ないかを確認します。
