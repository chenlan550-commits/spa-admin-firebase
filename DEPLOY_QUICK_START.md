# 🚀 快速部署指南

最簡單快速的部署方式，適合第一次部署或日常更新。

---

## 📦 方法一：使用 npm 腳本（最簡單）

### 完整部署（推薦）
```bash
pnpm run deploy
```
包含：靜態網站 + Firestore 規則 + 索引

### 僅部署網站
```bash
pnpm run deploy:hosting
```
最快，僅更新前端代碼

### 僅部署規則
```bash
pnpm run deploy:rules
```
僅更新 Firestore 規則和索引

---

## 🎯 方法二：使用部署腳本

### Windows
```powershell
.\scripts\deploy.ps1
```

### Linux/Mac
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

腳本會引導您選擇部署類型。

---

## ⚡ 方法三：手動部署

### 步驟 1: 構建
```bash
pnpm run build
```

### 步驟 2: 部署
```bash
firebase deploy --only hosting
```

---

## 🔧 首次部署前準備

### 1. 確認已安裝 Firebase CLI
```bash
firebase --version
```

如未安裝：
```bash
npm install -g firebase-tools
```

### 2. 登入 Firebase
```bash
pnpm run firebase:login
# 或
firebase login
```

### 3. 確認專案
```bash
pnpm run firebase:projects
# 或
firebase projects:list
```

應該看到 `spa-admin-firebase (current)`

---

## ✅ 部署後檢查

1. **訪問網站**
   - https://spa-admin-firebase.web.app

2. **測試登入功能**
   - 使用管理員帳號登入

3. **檢查主要功能**
   - 儀表板載入正常
   - 資料顯示正確
   - 所有功能正常運作

---

## 🔄 日常更新流程

```bash
# 1. 更新代碼後，直接部署
pnpm run deploy:hosting

# 2. 等待構建和上傳完成（約 1-2 分鐘）

# 3. 訪問網站驗證更新
# https://spa-admin-firebase.web.app
```

---

## 🆘 常見問題

### 部署失敗？
```bash
# 1. 清除快取重新構建
rm -rf dist
pnpm run build

# 2. 重新部署
firebase deploy --only hosting
```

### 權限錯誤？
```bash
# 重新登入
firebase logout
firebase login
```

### 看到舊版本？
- 清除瀏覽器快取（Ctrl+F5 或 Cmd+Shift+R）
- 或使用無痕模式

---

## 📱 自動化部署

推送到 GitHub main 分支會自動部署：

```bash
git add .
git commit -m "update: description"
git push origin main
```

GitHub Actions 會自動：
1. 構建專案
2. 部署到 Firebase
3. 更新 Firestore 規則

查看進度：GitHub > Actions

---

## 📚 需要更多資訊？

查看完整文檔：`DEPLOYMENT.md`

---

**快速命令參考**

| 命令 | 說明 |
|------|------|
| `pnpm run deploy` | 完整部署 |
| `pnpm run deploy:hosting` | 僅部署網站 |
| `pnpm run deploy:rules` | 僅部署規則 |
| `pnpm run build` | 本地構建 |
| `pnpm run preview` | 預覽構建結果 |
| `firebase login` | 登入 Firebase |
| `firebase projects:list` | 查看專案列表 |

---

**部署 URL**: https://spa-admin-firebase.web.app

**預計部署時間**: 1-2 分鐘
