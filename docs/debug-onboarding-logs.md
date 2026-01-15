# Onboardingページのデバッグログ確認方法

## 問題

リダイレクトが即座に実行されるため、ブラウザのコンソールログを確認する時間がない。

## 解決方法

### 方法1: デバッグモードを使用（推奨）

1. **URLパラメータでデバッグモードを有効化**:
   ```
   http://localhost:3000/onboarding?debug=true
   ```

2. **開発環境では自動的にデバッグモードが有効**:
   - `localhost` または `127.0.0.1` でアクセスしている場合、自動的にデバッグモードが有効になります
   - リダイレクトが10秒遅延されます

3. **デバッグモード時の動作**:
   - リダイレクトが10秒後に実行されます
   - 成功メッセージが表示されます
   - 「手動でリダイレクト」ボタンで即座にリダイレクトできます
   - ブラウザのコンソールでログを確認できます

### 方法2: サーバー側のログを確認

**重要**: サーバー側のログは、Next.jsの開発サーバーを実行しているターミナルに出力されます。

1. **ターミナルを開く**:
   - Next.jsの開発サーバー（`npm run dev`）を実行しているターミナルを確認

2. **ログの確認**:
   - 以下のプレフィックスでログが出力されます：
     - `[API]`: API Routeのログ
     - `[Middleware]`: ミドルウェアのログ
     - `[DB]`: データベース関数のログ

3. **ログの例**:
   ```
   [API] /api/goals/initial - Start
   [API] Getting user...
   [API] User authenticated: xxx-xxx-xxx
   [API] Creating initial goals...
   [DB] createInitialGoals: Start
   [DB] Inserting goals: [...]
   [DB] Goals inserted successfully: [...]
   [API] Verifying goals were saved...
   [API] Verification attempt 1/3...
   [API] Verification complete (took 50ms, 1 attempts)
   [Middleware] Checking goals for user xxx-xxx-xxx at path /
   [Middleware] Goals query completed (took 30ms): {...}
   [Middleware] hasGoals: true (expected: 3 goals, actual: 3)
   ```

### 方法3: ブラウザの開発者ツールでログを保持

1. **開発者ツールを開く** (F12)
2. **Consoleタブを開く**
3. **設定（⚙️）を開く**
4. **"Preserve log"（ログを保持）にチェックを入れる**
5. これで、ページ遷移後もログが保持されます

### 方法4: ネットワークタブでAPIレスポンスを確認

1. **開発者ツールを開く** (F12)
2. **Networkタブを開く**
3. **目標を保存**
4. **`/api/goals/initial` のリクエストをクリック**
5. **Responseタブでレスポンス内容を確認**

## 確認すべきログのポイント

### 1. API Routeのログ

- `[API] Goals created successfully`: 目標が保存された
- `[API] Verification complete`: 検証が成功した
- `[API] Verification attempt X/3`: 何回目の試行で成功したか
- `[API] Total processing time: XXXms`: 処理時間

### 2. ミドルウェアのログ

- `[Middleware] Checking goals for user XXX`: 目標チェックが実行された
- `[Middleware] Goals query completed`: クエリが完了した
- `[Middleware] hasGoals: true/false`: 目標が存在するか
- `[Middleware] Redirecting to /`: リダイレクトが実行された

### 3. タイミングの確認

- API Routeの完了時刻とミドルウェアの実行時刻の差
- 目標が保存されてから、ミドルウェアで取得できるまでの時間

## トラブルシューティング

### ログが表示されない場合

1. **サーバーが起動しているか確認**
2. **ターミナルでエラーが出ていないか確認**
3. **ブラウザのコンソールでエラーが出ていないか確認**

### リダイレクトが即座に実行される場合

1. **URLに `?debug=true` を追加**
2. **開発環境（localhost）でアクセスしているか確認**
3. **ブラウザのコンソールで `[Onboarding] Debug mode enabled` が表示されるか確認**

### 目標が保存されない場合

1. **API Routeのログでエラーを確認**
2. **データベースの接続を確認**
3. **認証状態を確認**

## 次のステップ

ログを確認した後、以下の情報を共有してください：

1. **API Routeのログ**:
   - 目標が保存されたか
   - 検証が成功したか（何回目の試行で成功したか）
   - 処理時間

2. **ミドルウェアのログ**:
   - 目標が取得できたか
   - 取得できた目標の数
   - リダイレクトが実行されたか

3. **タイミング**:
   - API Routeの完了時刻
   - ミドルウェアの実行時刻
   - 時間差

これらの情報に基づいて、問題の原因を特定し、適切な修正を行います。
