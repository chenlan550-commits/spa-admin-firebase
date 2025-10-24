# 豪華水療管理系統

一個功能完整的水療中心管理系統，包含客戶管理、預約管理、來店記錄、報表分析等功能。

## 功能特色

### 核心功能

✅ **使用者認證**
- Firebase Email/Password 認證
- 安全的登入/登出機制
- 持久化登入狀態

✅ **即時儀表板**
- 今日預約、本月預約統計
- 總客戶數、本月營收
- 電子報訂閱人數、未讀訊息數
- 會員等級分布統計
- 最近預約記錄
- 數據視覺化展示

✅ **客戶管理**
- 完整的客戶資料 CRUD
- 會員等級管理（一般/2萬/3萬/5萬/VIP）
- 儲值餘額追蹤
- VIP 資格自動檢測（年消費12萬）
- VIP 審核機制
- 消費總額和來店次數統計
- 年度統計數據
- 客戶搜尋和篩選

✅ **預約管理**
- 完整的預約 CRUD 操作
- 預約狀態管理（待確認、已確認、已完成、已取消）
- 客戶資料自動關聯
- 快速完成預約
- 日期時間選擇
- 服務項目選擇

✅ **來店管理** 🆕
- 記錄客戶來店消費
- 自動計算會員折扣
- 多種付款方式（現金、刷卡、儲值）
- 自動更新客戶統計數據
- 自動檢查VIP資格
- 來店記錄查詢

✅ **訊息中心** 🆕
- 客戶聯絡訊息管理
- 訊息狀態追蹤（未讀、已讀、已回覆）
- 電子報訂閱者管理
- 訂閱者語言偏好設定
- 訊息搜尋和篩選

✅ **報表分析** 🆕
- 營收報表（日/月/年趨勢）
- 客戶分析（會員分布、新增趨勢）
- 服務統計（熱門服務、營收貢獻）
- 付款方式分析
- 多維度數據視覺化（折線圖、圓餅圖、柱狀圖）

✅ **療程管理**
- 療程 CRUD 操作
- 多語言支援（中文、英文、日文）
- 服務分類（臉部、身體、按摩、特殊）
- 價格和時長管理
- 圖片URL管理
- 卡片式視圖展示

✅ **內容管理**
- 多語言內容編輯
- 網站各頁面內容管理
- 富文本編輯器
- 內容發布控制

✅ **系統設定**
- 營業時間設定
- 聯絡資訊管理
- 預約參數設定
- 價格折扣設定

### 會員制度（簡化版）

只有兩個等級：

- **一般會員** - 無折扣，原價消費
- **VIP會員** - 所有療程享5折優惠（年度來店40次自動符合資格，需管理員審核）

### 儲值系統（獨立功能）

- 儲值不再綁定會員等級
- 所有會員都可以儲值
- 每筆儲值產生收據編號，用於與實體儲值卡比對
- 支援客戶簽名驗證功能

## 技術架構

### 前端技術
- React 19.1.0
- Vite 6.3.5
- Tailwind CSS 4.1.7
- Radix UI (shadcn/ui)
- Recharts (數據視覺化)
- React Router DOM 7.6.1
- React Hook Form + Zod
- date-fns
- Lucide React

### 後端服務
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

### 性能優化
- React.lazy 代碼分割
- Suspense 懶加載
- Firestore 查詢索引優化
- 組件級別優化

## 快速開始

### 前置需求
- Node.js 18+
- pnpm 8+
- Firebase CLI

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/chenlan550-commits/spa-admin-firebase.git
cd spa-admin-firebase
```

2. **安裝依賴**
```bash
pnpm install
```

3. **Firebase 設定**

Firebase 配置已內建於專案中（`src/lib/firebase.js`），無需額外設定環境變數。

4. **啟動開發伺服器**
```bash
pnpm dev
```

開發伺服器會在 `http://localhost:5173` 啟動

### 部署到 Firebase

1. **構建專案**
```bash
pnpm build
```

2. **登入 Firebase**
```bash
firebase login
```

3. **部署**
```bash
# 部署所有內容
firebase deploy

# 僅部署靜態檔案
firebase deploy --only hosting

# 部署資料庫規則和索引
firebase deploy --only firestore
```

## 測試數據

使用測試數據腳本快速生成範例資料：

```bash
node scripts/addTestReportData.js
```

這會創建：
- 8個測試客戶（不同會員等級）
- 24-64筆來店記錄
- 8-24筆預約記錄
- 3筆聯絡訊息
- 5個電子報訂閱者

## 專案結構

```
spa-admin-firebase/
├── src/
│   ├── components/          # React 組件
│   │   ├── Dashboard.jsx           # 儀表板
│   │   ├── CustomerManagement.jsx  # 客戶管理
│   │   ├── BookingManagement.jsx   # 預約管理
│   │   ├── VisitManagement.jsx     # 來店管理 🆕
│   │   ├── MessageCenter.jsx       # 訊息中心 🆕
│   │   ├── Reports.jsx             # 報表分析 🆕
│   │   ├── ServiceManagement.jsx   # 療程管理
│   │   ├── ContentManagement.jsx   # 內容管理
│   │   ├── SettingsManagement.jsx  # 系統設定
│   │   ├── Login.jsx               # 登入頁面
│   │   └── ui/                     # UI 組件庫
│   ├── services/            # Firebase 服務層
│   │   ├── customerService.js
│   │   ├── bookingService.js
│   │   ├── visitService.js         🆕
│   │   ├── reportService.js        🆕
│   │   ├── contactService.js       🆕
│   │   ├── newsletterService.js    🆕
│   │   ├── serviceService.js
│   │   ├── contentService.js
│   │   └── settingsService.js
│   ├── contexts/            # React Context
│   │   └── AuthContext.jsx
│   ├── hooks/               # 自定義 Hooks
│   │   └── use-toast.js
│   ├── lib/                 # 工具函數
│   │   ├── firebase.js      # Firebase 配置
│   │   └── utils.js
│   └── App.jsx              # 主應用
├── scripts/                 # 工具腳本
│   ├── addTestReportData.js        # 測試數據生成 🆕
│   ├── addTestBooking.js
│   └── importServices.js
├── public/                  # 靜態資源
├── firebase.json            # Firebase 配置
├── firestore.rules          # 資料庫安全規則
├── firestore.indexes.json   # 資料庫索引
└── package.json
```

## 資料庫架構

### Firestore Collections

- `customers` - 客戶資料
- `appointments` - 預約記錄
- `visits` - 來店記錄 🆕
- `services` - 服務項目
- `content` - 網站內容
- `settings` - 系統設定
- `contact_messages` - 聯絡訊息 🆕
- `newsletter_subscribers` - 電子報訂閱 🆕

### 安全規則

**Firestore Rules**
- **公開讀取**: 服務、內容、設定
- **公開創建**: 預約、訊息、訂閱
- **需要認證**: 客戶管理、完整預約管理、來店記錄

詳細規則請參考 `firestore.rules`

## 使用說明

### 首次使用

1. 啟動應用後，使用 Firebase Console 創建管理員帳號
2. 登入後進入儀表板
3. 前往「系統設定」配置基本資訊
4. 在「療程管理」中新增療程項目
5. 在「客戶管理」中新增客戶
6. 在「預約管理」中開始管理預約

### 日常操作

- **查看統計**: 儀表板顯示即時統計數據
- **管理預約**: 查看、確認、完成預約
- **記錄來店**: 在「來店管理」記錄客戶消費
- **查看報表**: 在「報表分析」查看營收和客戶統計
- **處理訊息**: 在「訊息中心」回覆客戶訊息
- **VIP審核**: 在「客戶管理」審核符合資格的VIP申請

### VIP 自動升級流程

1. 客戶年度消費達到12萬元
2. 系統自動標記 `vipEligible = true`
3. 管理員在客戶管理頁面審核
4. 審核通過後，客戶升級為VIP（5折優惠）
5. VIP有效期為一年

## 故障排除

### 構建失敗
```bash
# 清除緩存重新安裝
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Firebase 部署失敗
```bash
# 確認已登入
firebase login

# 確認專案ID正確
firebase use spa-admin-firebase

# 重新部署
firebase deploy
```

### Firestore 權限錯誤
```bash
# 重新部署規則
firebase deploy --only firestore:rules

# 重新部署索引
firebase deploy --only firestore:indexes
```

## 相關連結

- **Firebase Console**: https://console.firebase.google.com/project/spa-admin-firebase
- **生產環境**: https://spa-admin-firebase.web.app
- **GitHub 倉庫**: https://github.com/chenlan550-commits/spa-admin-firebase

## 文檔

- [功能詳細說明](./FEATURES.md) - 完整功能文檔
- [快速開始指南](./QUICK_START.md) - 部署和配置指南

## 更新日誌

### v1.0.0 (2025-01)
- ✨ 新增來店管理功能
- ✨ 新增訊息中心
- ✨ 新增報表分析
- ✨ VIP 自動升級系統
- ✨ 會員折扣自動計算
- ⚡ 性能優化（代碼分割、懶加載）
- 📝 完善文檔

## 授權

本專案為私有專案，僅供授權使用者使用。

## 聯絡方式

如有問題或建議，請聯絡系統管理員。

---

**版本**: 1.0.0
**最後更新**: 2025年1月
**技術支援**: Firebase, React, Vite
