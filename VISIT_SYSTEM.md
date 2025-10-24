# 來店記錄系統說明

## 系統概述
完整的來店記錄管理系統，包含預約轉換、營收統計、客戶消費記錄追蹤等功能。

## 核心功能

### 1. 從預約建立來店記錄
**流程：預約管理 → 新增來店記錄按鈕 → 自動匯入資料**

#### 限制條件
- ✅ 只有**已付款**狀態的預約才能建立來店記錄
- ✅ 按鈕會在未付款狀態時自動禁用

#### 自動匯入的資料
從預約記錄自動帶入以下資料：
- 客戶ID (`customerId`)
- 客戶姓名 (`customerName`)
- 療程ID (`serviceId`)
- 療程名稱 (`serviceName`)
- 預約日期 → 來店日期 (`visitDate`)
- 療程時長 (`duration`)
- 原價 (`originalPrice`)
- 優惠價格 (`price`)
- 總價 (`totalPrice`)
- 自備精油 (`useSelfOil`)
- 額外精油費用 (`extraOilFee`)
- 付款方式 (`paymentMethod`)：現金 / 儲值扣款
- 付款狀態：自動設為**已付款**
- 備註 (`notes`)
- 預約ID關聯 (`bookingId`)

### 2. 營收統計功能

#### 統計卡片顯示
在來店記錄頁面頂部顯示四個統計卡片：

1. **總來店次數**
   - 顯示所有來店記錄總數
   - 顯示總營收金額

2. **今日來店**
   - 今日來店次數
   - 今日營收金額

3. **本月來店**
   - 本月來店次數
   - 本月營收金額

4. **付款統計**
   - 現金收入總額
   - 刷卡收入總額
   - 儲值扣款總額

#### 統計計算邏輯
```javascript
// visitService.js - getVisitStats()
- 自動計算日期範圍（今日、本月）
- 累加營收（使用 finalPrice 或 price）
- 按付款方式分類統計
```

### 3. 客戶消費記錄追蹤

#### 自動更新客戶資料
每次建立來店記錄時，系統會自動：

1. **更新消費次數**
   - 客戶記錄的 `visitCount` 自動 +1

2. **記錄消費歷史**
   - 在客戶文件的 `visitHistory` 子集合中新增記錄
   - 保留最近一年的消費記錄
   - 包含：來店ID、療程名稱、日期、價格、付款方式

3. **儲值扣款處理**
   - 如果付款方式為「儲值扣款」
   - 自動從客戶餘額扣除消費金額
   - 記錄餘額使用明細 (`balanceHistory`)

#### 客戶統計查詢
點擊來店記錄中的客戶姓名，可查看：
- 總來店次數
- 總消費金額
- 最後來店日期
- 最常消費療程
- 平均消費金額

### 4. 來店記錄管理

#### 列表顯示欄位
| 欄位 | 說明 |
|------|------|
| 日期 | 來店日期 |
| 客戶姓名 | 可點擊查看消費統計 |
| 療程 | 顯示療程名稱 + 精油標記 |
| 時長 | 療程時長（分鐘）|
| 金額 | VIP價格顯示紅色 |
| 付款方式 | 現金/刷卡/儲值 |
| 付款狀態 | 已付款/未付款 |
| 備註 | 備註內容 |
| 操作 | 編輯/刪除按鈕 |

#### 精油標記
- **自備精油**：綠色徽章顯示「自備精油」
- **額外精油費**：橘色徽章顯示「+NT$ XXX」

#### 篩選功能
- 🔍 搜尋：客戶姓名、療程名稱、備註
- 💳 付款方式篩選：全部/現金/刷卡/儲值

#### 編輯限制
- 未付款記錄：可編輯、可刪除
- 已付款記錄：不可編輯、可刪除（會退回儲值餘額）

## 資料庫結構

### Firestore 集合：`visits`

```javascript
{
  id: "visit_id",
  customerId: "customer_id",
  customerName: "客戶姓名",
  serviceId: "service_id",
  serviceName: "療程名稱",
  visitDate: Timestamp,
  duration: 60, // 分鐘

  // 價格資訊
  originalPrice: 2000, // 原價
  membershipType: "vip", // regular / vip
  discount: 0.5, // 折扣比例
  finalPrice: 1000, // 最終價格

  // 精油選項
  useSelfOil: false, // 一般客戶自備精油
  extraOilFee: 100, // VIP額外精油費用

  // 付款資訊
  paymentMethod: "cash", // cash / card / deposit
  paymentStatus: "paid", // paid / unpaid

  // 其他
  notes: "備註",
  bookingId: "關聯的預約ID",

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 客戶記錄更新

建立來店記錄時，會同步更新 `customers` 集合：

```javascript
// 主文件更新
{
  visitCount: +1, // 消費次數累加
  lastVisitDate: Timestamp, // 最後來店日期
  totalSpent: +finalPrice, // 累計消費金額
  balance: -finalPrice // (如果使用儲值扣款)
}

// 子集合：visitHistory
{
  visitId: "visit_id",
  serviceName: "療程名稱",
  visitDate: Timestamp,
  originalPrice: 2000,
  finalPrice: 1000,
  paymentMethod: "cash",
  discount: 0.5,
  createdAt: Timestamp
}

// 子集合：balanceHistory (僅儲值扣款)
{
  type: "usage",
  amount: -1000,
  visitId: "visit_id",
  serviceName: "療程名稱",
  createdAt: Timestamp
}
```

## 使用流程

### 完整流程：從預約到來店記錄

1. **客戶預約**（前端網站）
   - 客戶在網站填寫預約表單
   - 資料儲存到 `appointments` 集合
   - 狀態：未確認

2. **後台確認預約**（預約管理）
   - 管理員編輯預約
   - 選擇付款方式（現金/儲值扣款）
   - 點擊「確認付款」
   - 狀態：已完成 + 已付款

3. **建立來店記錄**（預約管理）
   - 點擊已付款預約的「新增來店記錄」按鈕
   - 系統自動匯入預約資料
   - 建立來店記錄到 `visits` 集合

4. **自動更新統計**
   - ✅ 營收統計自動更新
   - ✅ 客戶消費次數 +1
   - ✅ 客戶消費記錄新增
   - ✅ 如使用儲值，餘額自動扣除

5. **查看報表**（來店記錄頁面）
   - 查看營收統計卡片
   - 篩選和搜尋記錄
   - 點擊客戶名稱查看個人統計

## 付款方式處理

### 現金付款
- 直接記錄金額
- 不影響客戶餘額

### 刷卡付款
- 直接記錄金額
- 不影響客戶餘額

### 儲值扣款
- 檢查客戶餘額是否足夠
- 扣除消費金額
- 記錄餘額使用明細
- 顯示扣款前後餘額

## 錯誤處理

### 建立來店記錄時的驗證

1. **預約檢查**
   - ❌ 預約不存在 → 拋出錯誤
   - ❌ 預約未付款 → 拋出錯誤

2. **儲值檢查**
   - ❌ 餘額不足 → 拋出錯誤，顯示目前餘額
   - ✅ 餘額足夠 → 執行扣款

3. **資料完整性**
   - ❌ 缺少必填欄位 → 拋出錯誤
   - ✅ 資料完整 → 建立記錄

### 刪除來店記錄

- 如果是儲值付款，會自動退回餘額
- 確認對話框防止誤刪
- 刪除來店記錄不影響原始預約

## 系統優勢

1. **資料一致性**
   - 預約、來店記錄、客戶資料自動同步
   - 避免手動輸入錯誤

2. **即時統計**
   - 營收數據即時更新
   - 支援多種統計維度

3. **完整追蹤**
   - 每筆消費都有完整記錄
   - 可追溯到原始預約

4. **靈活付款**
   - 支援三種付款方式
   - 儲值餘額自動管理

## 相關文件

- `src/services/visitService.js` - 來店記錄服務層
- `src/services/bookingService.js` - 預約服務層
- `src/services/customerService.js` - 客戶服務層
- `src/components/VisitManagement.jsx` - 來店記錄管理介面
- `src/components/BookingManagement.jsx` - 預約管理介面
- `src/components/CustomerManagement.jsx` - 客戶管理介面
