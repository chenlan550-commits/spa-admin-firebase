# 部署指南 - 香熏緻身心調理館後台管理系統

完整的部署流程說明，包含手動部署和自動化 CI/CD 設置。

---

## 📋 目錄

1. [環境需求](#環境需求)
2. [Firebase 配置](#firebase-配置)
3. [手動部署](#手動部署)
4. [自動化部署 (CI/CD)](#自動化部署-cicd)
5. [部署驗證](#部署驗證)
6. [常見問題](#常見問題)

---

## 環境需求

### 必要工具

- **Node.js**: 18+ (建議使用 20 LTS)
- **pnpm**: 8+ (本專案使用 pnpm 10.4.1)
- **Firebase CLI**: 最新版本
- **Git**: 用於版本控制

### 安裝 Firebase CLI

```bash
npm install -g firebase-tools
```

### 驗證安裝

```bash
node --version        # 應顯示 v20.x.x
pnpm --version        # 應顯示 10.x.x
firebase --version    # 應顯示最新版本
```

---

## Firebase 配置

### 1. 登入 Firebase

```bash
firebase login
```

### 2. 初始化專案（已完成）

專案已配置好 Firebase，配置檔案：
- `firebase.json` - Firebase 主配置
- `firestore.rules` - Firestore 安全規則
- `firestore.indexes.json` - Firestore 索引配置

### 3. 檢查當前專案

```bash
firebase projects:list
firebase use spa-admin-firebase
```

---

## 手動部署

### 方法 1: 使用部署腳本（推薦）

#### Windows (PowerShell)
```powershell
.\scripts\deploy.ps1
```

#### Linux/Mac
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

腳本會自動：
1. ✅ 檢查 Firebase CLI
2. ✅ 安裝依賴
3. ✅ 構建專案
4. ✅ 部署到 Firebase
5. ✅ 顯示部署結果

### 方法 2: 手動命令

#### 步驟 1: 安裝依賴
```bash
pnpm install --frozen-lockfile
```

#### 步驟 2: 構建專案
```bash
pnpm run build
```

#### 步驟 3: 部署

**僅部署 Hosting（靜態網站）**
```bash
firebase deploy --only hosting
```

**部署 Hosting + Firestore 規則**
```bash
firebase deploy --only hosting,firestore:rules
```

**完整部署（Hosting + Firestore 規則 + 索引）**
```bash
firebase deploy --only hosting,firestore:rules,firestore:indexes
```

#### 步驟 4: 驗證部署
部署完成後，訪問：
- **正式環境**: https://spa-admin-firebase.web.app
- **Firebase Console**: https://console.firebase.google.com/project/spa-admin-firebase

---

## 自動化部署 (CI/CD)

本專案已配置 GitHub Actions，支援自動化部署。

### GitHub Actions 工作流

#### 1. Build Check (`.github/workflows/build-check.yml`)
- **觸發**: 所有分支的 push 和 PR
- **功能**:
  - 檢查代碼 lint
  - 構建專案
  - 生成構建報告
  - 保存構建產物

#### 2. Firebase Deploy (`.github/workflows/firebase-deploy.yml`)
- **觸發**: main 分支的 push 和 PR
- **功能**:
  - PR: 部署到預覽環境（7天後自動刪除）
  - main: 部署到正式環境
  - 自動部署 Firestore 規則和索引

### 配置 GitHub Secrets

需要在 GitHub Repository 設置以下 Secrets：

#### 1. 獲取 Firebase Service Account
```bash
# 在 Firebase Console 中生成 Service Account 金鑰
# 專案設置 > 服務帳戶 > 生成新的私密金鑰
```

#### 2. 獲取 Firebase Token
```bash
firebase login:ci
```

#### 3. 在 GitHub 設置 Secrets
前往 GitHub Repository：
`Settings` > `Secrets and variables` > `Actions` > `New repository secret`

新增以下 Secrets：
- `FIREBASE_SERVICE_ACCOUNT`: Firebase Service Account JSON（完整內容）
- `FIREBASE_TOKEN`: Firebase CI Token（從 firebase login:ci 取得）

### 部署流程

#### Pull Request
```bash
# 建立 PR 後自動觸發
# 會部署到預覽環境，並在 PR 中顯示預覽 URL
```

#### 合併到 main
```bash
git push origin main
# 自動部署到正式環境
```

---

## 部署驗證

### 1. 檢查網站可訪問性
```bash
curl -I https://spa-admin-firebase.web.app
# 應返回 200 OK
```

### 2. 檢查 Firestore 規則
在 Firebase Console 檢查：
- 專案 > Firestore Database > 規則
- 確認規則已更新

### 3. 檢查 Firestore 索引
在 Firebase Console 檢查：
- 專案 > Firestore Database > 索引
- 確認所有索引都已建立完成

### 4. 功能測試清單

登入後台管理系統，測試以下功能：

- [ ] 登入功能正常
- [ ] 儀表板數據顯示正確
- [ ] 預約管理功能正常
- [ ] 來店記錄功能正常
- [ ] 客戶管理功能正常
- [ ] 療程管理功能正常
- [ ] 訊息中心功能正常
- [ ] 報表分析功能正常

---

## 環境變數配置

### Firebase 配置

本專案的 Firebase 配置位於 `src/lib/firebase.js`，包含：
- API Key
- Auth Domain
- Project ID
- Storage Bucket
- Messaging Sender ID
- App ID

### 開發環境 vs 生產環境

目前使用同一個 Firebase 專案。如需分離開發和生產環境：

1. 建立新的 Firebase 專案（開發環境）
2. 複製 `src/lib/firebase.js` 並根據環境調整
3. 使用環境變數切換配置

---

## 建構優化

### Vite 建構配置 (`vite.config.js`)

已配置以下優化：

1. **代碼分割 (Code Splitting)**
   - React 核心庫
   - Firebase 相關
   - UI 組件庫
   - 各個功能模組

2. **壓縮設置**
   - 使用 esbuild 快速壓縮
   - CSS 代碼分割
   - 目標 ES2015

3. **快取策略** (`firebase.json`)
   - 圖片資源：1年快取
   - JS/CSS：1小時快取（需驗證）

### 建構產物分析

```bash
# 構建後檢查產物大小
pnpm run build

# 查看詳細資訊
du -sh dist
ls -lh dist/assets
```

---

## 版本管理策略

### 分支策略

- **main**: 正式環境，自動部署
- **develop**: 開發環境（可選）
- **feature/***: 功能分支
- **hotfix/***: 緊急修復

### 部署流程

```bash
# 1. 在功能分支開發
git checkout -b feature/new-feature

# 2. 提交變更
git add .
git commit -m "feat: add new feature"

# 3. 推送並建立 PR
git push origin feature/new-feature
# 在 GitHub 建立 PR，會自動部署預覽環境

# 4. 審查通過後合併到 main
# 自動觸發正式環境部署
```

---

## 監控與日誌

### Firebase Hosting 監控

前往 Firebase Console：
- Hosting > 使用情況
- 查看流量、帶寬使用量

### 效能監控（可選）

可啟用 Firebase Performance Monitoring：
```bash
# 安裝 SDK
pnpm add firebase/performance

# 在 src/lib/firebase.js 中初始化
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

---

## 回滾策略

### 方法 1: Firebase Hosting 版本管理

```bash
# 查看部署歷史
firebase hosting:channel:list

# 回滾到前一版本
firebase hosting:channel:deploy previous-version
```

### 方法 2: Git 回滾

```bash
# 回滾到前一個 commit
git revert HEAD
git push origin main
# 會自動觸發部署

# 或回滾到特定 commit
git revert <commit-hash>
git push origin main
```

---

## 常見問題

### Q1: 部署後看到舊版本？
**A**: 清除瀏覽器快取或使用無痕模式訪問

### Q2: Firebase CLI 權限錯誤？
**A**: 重新登入 Firebase
```bash
firebase logout
firebase login
```

### Q3: 建構失敗？
**A**:
1. 清除依賴並重新安裝
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```
2. 檢查 Node.js 版本是否符合要求

### Q4: Firestore 規則未生效？
**A**:
1. 確認已部署規則：`firebase deploy --only firestore:rules`
2. 在 Firebase Console 檢查規則是否正確

### Q5: GitHub Actions 失敗？
**A**:
1. 檢查 Secrets 是否正確設置
2. 查看 Actions 日誌找出錯誤原因
3. 確認 Firebase Token 未過期

### Q6: 預覽部署 URL 找不到？
**A**: PR 預覽 URL 會顯示在 GitHub Actions 運行結果中，也會自動評論在 PR 中

---

## 腳本說明

### 部署腳本

- `scripts/deploy.sh` - Linux/Mac 部署腳本
- `scripts/deploy.ps1` - Windows PowerShell 部署腳本

### 測試數據腳本

- `scripts/addTestReportData.js` - 生成測試報表數據
- `scripts/addTestBooking.js` - 生成測試預約數據
- `scripts/importServices.js` - 導入療程數據
- `scripts/checkVisitData.js` - 檢查來店記錄數據

---

## 安全建議

1. **不要提交敏感資訊**
   - `.env` 檔案加入 `.gitignore`
   - Firebase Service Account 金鑰僅存於 GitHub Secrets

2. **定期更新 Firestore 規則**
   - 審查資料存取權限
   - 限制寫入操作

3. **使用環境變數**
   - 敏感配置使用環境變數
   - 不同環境使用不同配置

4. **啟用 Firebase App Check**（建議）
   - 防止未授權的 API 請求
   - 保護後端資源

---

## 效能優化建議

1. **啟用 CDN**
   - Firebase Hosting 已內建 CDN
   - 全球分發，快速訪問

2. **圖片優化**
   - 使用 WebP 格式
   - 適當的圖片尺寸

3. **代碼分割**
   - 已配置，自動按路由分割
   - 懶加載非關鍵組件

4. **快取策略**
   - 已配置靜態資源快取
   - 適當的 Cache-Control headers

---

## 支援與聯絡

- **GitHub Issues**: 回報問題或功能請求
- **Firebase Support**: Firebase 相關問題
- **專案文檔**: 查看 `README.md` 和 `FEATURES.md`

---

**最後更新**: 2025年1月
**維護者**: spa-admin-firebase 團隊
