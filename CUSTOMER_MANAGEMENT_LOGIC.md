# 客戶管理系統邏輯說明

## 📋 目錄
1. [會員制度](#會員制度)
2. [儲值系統](#儲值系統)
3. [VIP會員管理](#vip會員管理)
4. [年度統計](#年度統計)
5. [資料結構](#資料結構)
6. [主要功能](#主要功能)

---

## 🎯 會員制度

### 會員等級（僅兩種）

```javascript
會員等級 = {
  regular: "一般會員",  // 預設等級
  vip: "VIP會員"        // 高級會員
}
```

### VIP會員資格獲得方式

#### 方式一：年度來店達標（免費）
- **條件**：年度來店滿 **40 次**
- **流程**：
  1. 系統自動檢測年度來店次數
  2. 達標後 `vipEligible = true`（符合資格）
  3. 管理員審核批准 `vipApproved = true`
  4. 升級為VIP會員，有效期一年

#### 方式二：直接購買（付費）
- **費用**：**NT$ 20,000**
- **付款方式**：
  - 現金 (cash)
  - 刷卡 (card)
  - 儲值扣款 (deposit)
- **流程**：
  1. 客戶選擇購買VIP
  2. 付款完成
  3. 立即升級為VIP，有效期一年

### VIP會員權益

1. **療程折扣**：所有療程享 **50% 折扣**
2. **有效期限**：一年（從購買或審核通過日期起算）
3. **精油政策**：
   - VIP預設已包含精油
   - 如忘記帶精油，可選擇額外付費（100元為單位）

---

## 💰 儲值系統

### 儲值特性

**重要**：儲值功能與會員等級**完全獨立**
- 一般會員可以儲值
- VIP會員也可以儲值
- 儲值不影響會員等級

### 儲值流程

```javascript
儲值 {
  充值金額: number,      // 實際支付金額
  贈送金額: number,      // 系統贈送金額（可選）
  總儲值金額: 充值金額 + 贈送金額,
  付款方式: "cash" | "card",
  收據編號: "DEP12345678"  // 用於比對實體卡
}
```

### 儲值記錄

每次儲值都會產生詳細記錄：
```javascript
{
  customerId: "客戶ID",
  depositAmount: 10000,      // 實際支付
  bonusAmount: 1000,         // 贈送金額
  totalAmount: 11000,        // 總儲值
  previousBalance: 5000,     // 儲值前餘額
  newBalance: 16000,         // 儲值後餘額
  paymentMethod: "cash",
  receiptNumber: "DEP12345678",
  operator: "管理員",
  depositDate: Timestamp,

  // 簽名確認（預留）
  signatureRequired: true,
  signatureVerified: false,
  signatureDate: null
}
```

### 儲值使用

1. **使用場景**：來店消費時選擇「儲值扣款」付款
2. **扣款邏輯**：
   ```javascript
   if (客戶餘額 >= 消費金額) {
     新餘額 = 當前餘額 - 消費金額
     記錄使用明細
   } else {
     提示餘額不足
   }
   ```

3. **餘額預警**：
   - 預設閾值：NT$ 1,000
   - 當餘額 < 閾值時，系統提示客戶充值

---

## 👑 VIP會員管理

### VIP資格欄位

```javascript
{
  // VIP資格判定
  vipEligible: false,         // 是否符合資格（年度40次）
  vipEligibleDate: null,       // 符合資格日期

  // VIP審核流程
  vipApproved: false,          // 管理員是否已審核
  vipApprovedBy: null,         // 審核人員
  vipApprovedDate: null,       // 審核日期

  // VIP有效期
  vipStartDate: null,          // VIP開始日期
  vipEndDate: null,            // VIP結束日期（一年後）

  // 會員等級
  membershipLevel: "vip"       // 升級為VIP
}
```

### VIP審核流程

```
客戶達到40次年度來店
    ↓
vipEligible = true（系統自動標記）
    ↓
管理員查看「符合VIP資格的客戶列表」
    ↓
管理員審核批准
    ↓
vipApproved = true
membershipLevel = "vip"
vipStartDate = 今天
vipEndDate = 一年後
```

### VIP購買流程

```
客戶要求購買VIP
    ↓
選擇付款方式（現金/刷卡/儲值）
    ↓
付款 NT$ 20,000
    ↓
立即升級為VIP
vipStartDate = 今天
vipEndDate = 一年後
```

### VIP到期處理

系統會檢查 `vipEndDate`：
```javascript
if (vipEndDate < 今天) {
  VIP已過期
  // 可選擇續約或降級為一般會員
}
```

---

## 📊 年度統計

### 統計資料結構

```javascript
currentYearStats: {
  year: 2025,              // 統計年度
  visitCount: 35,          // 年度來店次數
  totalSpent: 50000,       // 年度消費總額
  depositUsed: 15000       // 年度使用儲值金額
}
```

### 統計更新時機

1. **來店記錄新增時**：
   - `visitCount += 1`
   - `totalSpent += 消費金額`
   - 如使用儲值付款：`depositUsed += 扣款金額`

2. **年度重置**：
   - 每年1月1日自動重置為0
   - 保留歷史年度統計（可選）

3. **VIP資格檢查**：
   - 每次來店後檢查 `visitCount >= 40`
   - 達標自動標記 `vipEligible = true`

---

## 📁 資料結構

### 客戶資料（customers collection）

```javascript
{
  // === 基本資料 ===
  name: "王小明",
  phone: "0912345678",
  email: "wang@example.com",
  gender: "male",
  birthday: Timestamp,
  address: "台北市...",
  notes: "備註",

  // === 會員資訊 ===
  membershipLevel: "regular" | "vip",

  // === VIP資格管理 ===
  vipEligible: false,
  vipEligibleDate: null,
  vipApproved: false,
  vipApprovedBy: null,
  vipApprovedDate: null,
  vipStartDate: null,
  vipEndDate: null,

  // === 儲值資訊 ===
  balance: 5000,                    // 當前餘額
  totalDeposit: 15000,              // 累計儲值總額
  depositCount: 3,                  // 儲值次數
  lastDepositDate: Timestamp,
  lowBalanceThreshold: 1000,        // 餘額預警閾值

  // === 年度統計 ===
  currentYearStats: {
    year: 2025,
    visitCount: 35,
    totalSpent: 50000,
    depositUsed: 15000
  },

  // === 總體統計 ===
  totalVisits: 120,                 // 總來店次數
  totalSpent: 200000,               // 總消費金額
  firstVisitDate: Timestamp,
  lastVisitDate: Timestamp,

  // === 最近記錄（保留一年）===
  recentAppointments: [],
  recentVisits: [],

  // === 系統欄位 ===
  createdFrom: "manual" | "booking" | "import",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### 儲值記錄（deposit_records collection）

```javascript
{
  customerId: "客戶ID",
  customerName: "王小明",
  customerPhone: "0912345678",
  depositAmount: 10000,              // 實際支付
  bonusAmount: 1000,                 // 贈送金額
  totalAmount: 11000,                // 總儲值
  paymentMethod: "cash" | "card",
  previousBalance: 5000,
  newBalance: 16000,
  operator: "管理員",
  receiptNumber: "DEP12345678",
  notes: "備註",
  depositDate: Timestamp,

  signatureRequired: true,
  signatureVerified: false,
  signatureDate: null,

  createdAt: Timestamp
}
```

### 儲值使用記錄（balance_usage_records collection）

```javascript
{
  customerId: "客戶ID",
  customerName: "王小明",
  visitId: "來店記錄ID",
  serviceName: "芳香療法",
  amount: 1500,                      // 扣款金額
  previousBalance: 5000,
  newBalance: 3500,
  usageDate: Timestamp,
  createdAt: Timestamp
}
```

---

## 🛠️ 主要功能

### 1. 客戶管理基本功能

- ✅ **新增客戶** `createCustomer()`
- ✅ **編輯客戶** `updateCustomer()`
- ✅ **刪除客戶** `deleteCustomer()`
- ✅ **搜尋客戶** `searchCustomers(searchTerm)`
- ✅ **查看客戶詳情** `getCustomerById(id)`

### 2. 儲值管理

- ✅ **儲值充值** `addDeposit(customerId, amount, bonusAmount, paymentMethod)`
  - 支援贈送金額
  - 產生收據編號
  - 記錄充值明細

- ✅ **儲值扣款** `recordBalanceUsage(customerId, visitId, serviceName, amount)`
  - 檢查餘額是否足夠
  - 記錄使用明細

- ✅ **餘額預警** `checkLowBalance(customer)`
  - 檢查餘額是否低於閾值
  - 提醒客戶充值

- ✅ **查看儲值記錄** `getDepositRecords(customerId)`
- ✅ **查看使用記錄** `getBalanceUsageRecords(customerId)`

### 3. VIP會員管理

- ✅ **檢查VIP資格** `checkAndUpdateVIPEligibility(customerId)`
  - 自動檢查年度來店次數
  - 達標自動標記符合資格

- ✅ **購買VIP** `purchaseVIP(customerId, paymentMethod, operator)`
  - 支援三種付款方式
  - 立即升級為VIP
  - 設定一年有效期

- ✅ **審核VIP資格** `approveVIP(customerId, operator)`
  - 管理員審核通過
  - 升級為VIP會員

- ✅ **查看符合VIP資格的客戶** `getVIPEligibleCustomers()`
  - 列出所有 vipEligible = true 的客戶
  - 方便管理員批量審核

### 4. 統計與報表

- ✅ **會員等級統計** `getMembershipStats()`
  ```javascript
  {
    regular: 150,           // 一般會員數
    vip: 30,                // VIP會員數
    total: 180,             // 總會員數
    withDeposit: 80,        // 有儲值的客戶數
    totalBalance: 500000    // 總儲值餘額
  }
  ```

- ✅ **客戶消費記錄** `getVisitsByCustomerId(customerId)`
  - 查看客戶所有來店消費記錄
  - 用於統計年度來店次數

---

## 🔄 業務流程範例

### 場景一：新客戶來店消費

```
1. 新增客戶資料
   → membershipLevel = "regular"
   → currentYearStats.visitCount = 0

2. 客戶消費療程
   → 選擇付款方式（現金/刷卡）
   → 建立來店記錄

3. 更新統計
   → currentYearStats.visitCount += 1
   → currentYearStats.totalSpent += 消費金額
   → totalVisits += 1
```

### 場景二：客戶儲值

```
1. 客戶要求儲值 NT$ 10,000
2. 系統贈送 NT$ 1,000
3. 選擇付款方式：刷卡
4. 產生收據編號：DEP12345678
5. 更新餘額：0 → 11,000
6. 記錄儲值明細到 deposit_records
```

### 場景三：使用儲值付款

```
1. 客戶來店消費 NT$ 1,500
2. 選擇付款方式：儲值扣款
3. 檢查餘額：11,000 >= 1,500 ✓
4. 扣款：11,000 - 1,500 = 9,500
5. 記錄使用明細到 balance_usage_records
6. 更新年度統計
```

### 場景四：客戶升級VIP（年度達標）

```
1. 客戶年度來店第40次
2. 系統自動檢查：visitCount = 40 >= 40 ✓
3. 標記符合資格：vipEligible = true
4. 管理員查看待審核列表
5. 管理員批准
   → vipApproved = true
   → membershipLevel = "vip"
   → vipStartDate = 今天
   → vipEndDate = 一年後
6. 下次消費享50%折扣
```

### 場景五：VIP客戶來店（忘記帶精油）

```
1. VIP客戶選擇療程
2. 系統自動計算：原價 × 50% = VIP價格
3. 客戶表示忘記帶精油
4. 選擇額外付費：+NT$ 200
5. 最終金額 = VIP價格 + 200
6. 完成付款
```

---

## ⚠️ 注意事項

1. **會員等級與儲值分離**
   - 儲值不影響會員等級
   - VIP會員也可以儲值
   - 會員等級只影響療程折扣

2. **VIP有效期管理**
   - VIP有效期為一年
   - 到期前可提醒客戶續約
   - 到期後可選擇續約或降級

3. **年度統計重置**
   - 每年1月1日重置年度統計
   - 需保留歷史統計數據

4. **餘額安全**
   - 每次扣款前檢查餘額
   - 記錄完整的使用明細
   - 支援退款機制（需實作）

5. **資料一致性**
   - 儲值和扣款使用事務處理
   - 確保餘額計算準確
   - 定期對帳檢查

---

**文檔版本**: 1.0
**最後更新**: 2025-10-22
**維護者**: Claude Code
