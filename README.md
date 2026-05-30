# BarShift Pro v2 🍸

バー・飲食店向け PWA シフト管理アプリ。**タイムゾーン(JST)修正済み**。

## デプロイ手順

### 1. GitHubにプッシュ
```bash
git init && git add . && git commit -m "feat: BarShift Pro v2"
git branch -M main
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Neon DB（無料）
[neon.tech](https://neon.tech) → New Project → Connection stringをコピー

### 3. Render（バックエンド・無料）
[render.com](https://render.com) → New Web Service → GitHubリポジトリ接続

| 設定 | 値 |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install && npx prisma generate && npx prisma migrate deploy` |
| Start Command | `node index.js` |

環境変数:
- `DATABASE_URL` = NeonのConnection string
- `JWT_SECRET` = ランダムな文字列
- `NODE_ENV` = `production`
- `CLIENT_URL` = VercelのURL（後で設定）

デプロイ後、ShellタブでシードDB投入:
```bash
node prisma/seed.js
```

### 4. Vercel（フロントエンド・無料）
[vercel.com](https://vercel.com) → New Project → GitHubリポジトリ接続

環境変数:
- `VITE_API_URL` = RenderのURL
- `VITE_STORE_ID` = `store-demo`

### 5. RenderのCLIENT_URLを更新
VercelのURLをRenderの`CLIENT_URL`に設定して再デプロイ

## デモPIN

| スタッフ | PIN | 権限 |
|---|---|---|
| 田中 花子 | 1111 | 管理者 |
| 鈴木 健太 | 2222 | スタッフ |
| 佐藤 めぐみ | 3333 | スタッフ |
| 山田 大輝 | 4444 | スタッフ |
| 伊藤 結衣 | 5555 | スタッフ |
| 渡辺 翔 | 6666 | スタッフ |

## 修正履歴
- v2.0.0: タイムゾーンをJST(UTC+9)に修正
