# 香熏緻身心調理館 - 後台管理系統

一個基於 React + Firebase 的現代化 SPA 後台管理系統，專為身心調理館設計。

## 功能特色

### 已完成功能

✅ **使用者認證**
- Firebase Email/Password 認證
- 登入/註冊功能
- 安全的登出機制

✅ **儀表板**
- 即時統計數據（今日預約、本月預約、總會員數、本月營收）
- 最新預約列表
- 數據視覺化展示

✅ **客戶管理**
- 完整的 CRUD 操作
- 客戶資料搜尋功能
- 客戶聯絡資訊管理

✅ **預約管理**
- 完整的預約 CRUD 操作
- 日曆視圖選擇日期
- 預約狀態管理（待確認、已確認、已完成、已取消）
- 按日期篩選預約

✅ **療程管理**
- 療程 CRUD 操作
- 圖片上傳至 Firebase Storage
- 療程價格、時長管理
- 卡片式視圖展示

✅ **內容管理**
- 多類型內容管理（關於我們、特色服務、客戶評價等）
- 內容發布狀態控制
- 富文本內容編輯

✅ **系統設定**
- 營業時間設定（每日開關、營業時段）
- 聯絡資訊管理（電話、郵箱、地址、社交媒體）
- 預約設定（提前預約天數、時段長度等）
- 通知設定（郵件、簡訊、預約確認、提醒）

## 技術棧

- **前端框架**: React 19.1.0
- **構建工具**: Vite 6.3.5
- **後端服務**: Firebase
  - Authentication（身份驗證）
  - Firestore（資料庫）
  - Storage（圖片存儲）
- **UI 框架**:
  - Tailwind CSS 4.1.7
  - shadcn/ui（基於 Radix UI）
- **路由**: React Router DOM 7.6.1
- **表單處理**: React Hook Form + Zod
- **日期處理**: date-fns
- **圖示**: Lucide React

## 安裝步驟

### 1. 克隆專案

```bash
git clone <repository-url>
cd spa-admin-firebase
```

### 2. 安裝依賴

```bash
pnpm install
```

### 3. Firebase 設定

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 創建新專案或選擇現有專案
3. 在專案設定中獲取 Firebase 配置資訊
4. 複製 `.env.example` 為 `.env`

```bash
cp .env.example .env
```

5. 填入 Firebase 配置到 `.env` 檔案

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Firebase 安全規則設定

在 Firebase Console 中設定以下安全規則：

**Firestore 規則**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 只允許已認證用戶讀寫
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Storage 規則**:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /services/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. 啟用 Firebase 功能

在 Firebase Console 中啟用：
- Authentication > Email/Password
- Firestore Database
- Storage

### 6. 運行開發伺服器

```bash
pnpm dev
```

應用將在 `http://localhost:5173` 啟動

## 建置部署

```bash
pnpm build
```

建置後的檔案在 `dist` 目錄中。

### 部署到 Firebase Hosting

```bash
# 安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案
firebase init hosting

# 部署
firebase deploy
```

## 專案結構

```
spa-admin-firebase/
├── src/
│   ├── components/          # React 組件
│   │   ├── ui/             # shadcn/ui 基礎組件
│   │   ├── Dashboard.jsx    # 主儀表板
│   │   ├── Login.jsx        # 登入頁面
│   │   ├── CustomerManagement.jsx
│   │   ├── BookingManagement.jsx
│   │   ├── ServiceManagement.jsx
│   │   ├── ContentManagement.jsx
│   │   └── SettingsManagement.jsx
│   ├── services/            # Firebase 服務層
│   │   ├── customerService.js
│   │   ├── bookingService.js
│   │   ├── serviceService.js
│   │   ├── contentService.js
│   │   └── settingsService.js
│   ├── contexts/            # React Context
│   │   └── AuthContext.jsx
│   ├── lib/                 # 工具函數
│   │   ├── firebase.js      # Firebase 配置
│   │   └── utils.js
│   ├── hooks/               # 自定義 Hooks
│   ├── App.jsx              # 主應用
│   └── main.jsx             # 應用入口
├── public/                  # 靜態資源
├── .env.example             # 環境變數範例
└── package.json
```

## Firestore 資料結構

### customers (客戶)
```javascript
{
  name: string,
  phone: string,
  email: string,
  address: string,
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### bookings (預約)
```javascript
{
  customerId: string,
  customerName: string,
  serviceId: string,
  serviceName: string,
  bookingDate: Timestamp,
  bookingTime: string,
  duration: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled',
  notes: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### services (療程)
```javascript
{
  name: string,
  description: string,
  price: number,
  duration: number,
  imageUrl: string,
  order: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### content (內容)
```javascript
{
  type: string,
  title: string,
  content: string,
  isPublished: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### system/settings (系統設定)
```javascript
{
  businessHours: {
    monday: { open: string, close: string, isOpen: boolean },
    // ... 其他日期
  },
  contactInfo: {
    phone: string,
    email: string,
    address: string,
    lineId: string,
    facebook: string,
    instagram: string
  },
  bookingSettings: {
    advanceBookingDays: number,
    minBookingHours: number,
    slotDuration: number,
    bufferTime: number
  },
  notifications: {
    emailNotifications: boolean,
    smsNotifications: boolean,
    bookingConfirmation: boolean,
    bookingReminder: boolean,
    reminderHoursBefore: number
  }
}
```

## 使用說明

### 首次使用

1. 啟動應用後，點擊「註冊新帳號」創建管理員帳號
2. 登入後進入儀表板
3. 前往「系統設定」配置基本資訊
4. 在「療程管理」中新增療程項目
5. 在「客戶管理」中新增客戶
6. 在「預約管理」中開始管理預約

### 日常操作

- **查看統計**: 儀表板顯示即時統計數據
- **管理預約**: 使用日曆選擇日期，查看當日預約
- **客戶搜尋**: 在客戶管理頁面使用搜尋框快速找到客戶
- **上傳圖片**: 療程管理支援圖片上傳，圖片會自動存儲到 Firebase Storage

## 常見問題

### Q: 無法登入？
A: 確認 Firebase Authentication 已啟用 Email/Password 登入方式

### Q: 圖片上傳失敗？
A: 檢查 Firebase Storage 規則是否正確設定，並確認用戶已登入

### Q: 資料無法載入？
A: 檢查 Firestore 規則，確認已允許已認證用戶讀寫權限

### Q: 部署後環境變數無效？
A: 確認生產環境的 `.env.production` 檔案已正確配置

## 授權

MIT License

## 聯絡方式

如有問題或建議，歡迎提出 Issue。
