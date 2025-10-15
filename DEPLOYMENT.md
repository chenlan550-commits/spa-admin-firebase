# 後台管理系統部署指南

## 部署到 Firebase Hosting

### 1. 安裝 Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. 登入 Firebase

```bash
firebase login
```

### 3. 初始化專案（如果尚未初始化）

```bash
cd C:\Users\polung\Desktop\spa-admin-firebase
firebase init hosting
```

選擇：
- 使用現有專案: `spa-admin-firebase`
- Public directory: `dist`
- Single-page app: `Yes`
- Set up automatic builds and deploys with GitHub: `No` (可選)

### 4. 構建應用

```bash
npm run build
```

### 5. 部署到 Firebase

```bash
firebase deploy --only hosting
```

### 6. 部署 Firestore 規則和索引

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

或一次性部署全部：
```bash
firebase deploy
```

### 7. 設置環境變數

在 Firebase Hosting 中，環境變數需要在構建時設置。確保本地有 `.env` 文件：

```bash
# 複製 .env.example 為 .env
cp .env.example .env
```

然後編輯 `.env` 文件，填入正確的配置。

### 8. 自動部署設置（可選）

#### 8.1 使用 GitHub Actions

創建 `.github/workflows/firebase-hosting-merge.yml`:

\`\`\`yaml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: \${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: \${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: \${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: \${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: \${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: \${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '\${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '\${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: spa-admin-firebase
\`\`\`

### 9. 訪問後台

部署成功後，您的後台系統可通過以下地址訪問：
```
https://spa-admin-firebase.web.app
或
https://spa-admin-firebase.firebaseapp.com
```

### 10. 自定義域名（可選）

1. 進入 Firebase Console
2. 選擇 Hosting
3. 點擊 "Add custom domain"
4. 按照指示設置 DNS 記錄

### 11. 安全設置

#### 11.1 Firebase Authentication 規則

確保只有授權用戶可以訪問後台：

在 Firebase Console > Authentication > Settings 中：
- 設置授權的電子郵件地址
- 啟用電子郵件/密碼登入

#### 11.2 Firestore Security Rules

已在 `firestore.rules` 中配置，確保：
- 前端可以創建預約
- 只有登入用戶可以管理數據

### 12. 監控和維護

- 查看 Firebase Console > Hosting 的使用統計
- 查看 Firebase Console > Firestore 的數據庫使用情況
- 定期檢查 Security Rules 的執行情況

### 13. 更新部署

每次更新代碼後：
```bash
npm run build
firebase deploy
```

### 14. 與前端網站整合

前端網站 (polung.dpdns.org) 和後台系統共享同一個 Firebase 專案：

```
前端網站 (Cloudflare Pages)
  ↓ 創建預約
Firebase Firestore (appointments)
  ↓ 讀取和管理
後台系統 (Firebase Hosting)
```

### 15. 常見問題

**Q: 部署失敗**
A: 檢查 Firebase CLI 版本和登入狀態

**Q: 無法訪問部署的網站**
A: 檢查 Firebase Hosting 狀態和 DNS 設置

**Q: 環境變數未生效**
A: 確保 .env 文件存在並在構建時被正確讀取

### 16. 回滾

如需回滾到之前的版本：
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

或在 Firebase Console > Hosting 中選擇歷史部署版本進行回滾。
