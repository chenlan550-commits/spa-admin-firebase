# 會員制度說明

## 會員等級（簡化版）

系統採用簡化的會員制度，只有兩個等級：

### 1. 一般會員 (Regular)
- **權益**: 無折扣，原價消費
- **升級條件**: 自動成為一般會員
- **標識**: 灰色標籤

### 2. VIP會員 (VIP)
- **權益**: 所有療程享 **5折優惠**
- **升級條件**: 年度來店滿 **40次**
- **審核流程**: 需要管理員審核通過
- **有效期**: 一年（從審核通過日起算）
- **標識**: 玫瑰紅色標籤

---

## VIP 升級流程

### 自動觸發條件
當客戶在一個年度內來店次數達到 **40次** 時：
1. 系統自動標記為 `vipEligible = true`
2. 記錄符合資格的日期 `vipEligibleDate`
3. 在客戶管理頁面顯示「待審核」標籤

### 管理員審核
1. 進入「客戶管理」頁面
2. 篩選「符合VIP資格」的客戶
3. 點擊「審核VIP」按鈕
4. 確認通過後：
   - 客戶等級升級為 VIP
   - VIP 開始日期設為審核當日
   - VIP 結束日期設為一年後
   - 記錄審核人員和審核日期

### VIP 有效期管理
- VIP 會員享有一年的優惠期限
- 到期後自動降為一般會員
- 需重新累積來店次數才能再次符合資格

---

## 儲值系統（獨立功能）

### 重要變更
儲值功能已與會員等級**完全分離**：
- ❌ 不再有「儲值會員」等級
- ✅ 所有會員（一般/VIP）都可以儲值
- ✅ 儲值不影響會員等級
- ✅ 儲值可享受當前會員等級的折扣

### 儲值充值
客戶可以選擇任意金額進行儲值：

```javascript
// 常見儲值方案（可自訂）
20,000 元 → 贈送 2,000 元 = 總計 22,000 元
30,000 元 → 贈送 3,000 元 = 總計 33,000 元
50,000 元 → 贈送 5,000 元 = 總計 55,000 元
```

### 儲值記錄
每筆儲值都會產生：
- ✅ **收據編號**: 用於與實體儲值卡比對
- ✅ **充值金額**: 客戶實際支付的金額
- ✅ **贈送金額**: 系統贈送的額外金額
- ✅ **總儲值額**: 充值 + 贈送的總額
- ✅ **付款方式**: 現金或刷卡
- ✅ **操作人員**: 記錄處理人員
- ✅ **簽名欄位**: 預留客戶簽名確認
  - `signatureRequired`: 是否需要簽名
  - `signatureVerified`: 簽名是否已驗證
  - `signatureDate`: 簽名日期

### 實體卡比對流程

1. **充值時**:
   ```
   系統產生收據編號: DEP12345678
   → 記錄在系統資料庫
   → 打印到實體儲值卡
   → 客戶簽名確認
   ```

2. **驗證時**:
   ```
   輸入實體卡上的收據編號
   → 系統查詢 deposit_records
   → 比對金額、日期、客戶資訊
   → 確認簽名已驗證
   ```

3. **查詢儲值記錄**:
   ```javascript
   getDepositByReceiptNumber('DEP12345678')
   // 返回該筆充值的完整資訊
   ```

### 儲值消費
- 使用儲值付款時，會先扣除餘額
- VIP會員使用儲值付款，仍享 5折優惠
- 餘額不足時會提示補足差額

---

## 折扣計算邏輯

### 一般會員消費
```
原價: NT$ 4,500
折扣: 1.0（無折扣）
最終價格: NT$ 4,500
```

### VIP會員消費
```
原價: NT$ 4,500
折扣: 0.5（5折）
最終價格: NT$ 2,250
```

### VIP會員 + 儲值付款
```
原價: NT$ 4,500
折扣: 0.5（VIP 5折）
最終價格: NT$ 2,250
付款方式: 從儲值餘額扣除 NT$ 2,250
```

---

## 資料庫結構

### customers (客戶資料)
```javascript
{
  // 基本資料
  name: string,
  phone: string,
  email: string,

  // 會員等級（只有兩種）
  membershipLevel: 'regular' | 'vip',

  // VIP 資格管理
  vipEligible: boolean,           // 是否符合VIP資格
  vipEligibleDate: Timestamp,      // 符合資格日期
  vipApproved: boolean,            // 是否已審核通過
  vipApprovedBy: string,           // 審核人員
  vipApprovedDate: Timestamp,      // 審核日期
  vipStartDate: Timestamp,         // VIP開始日期
  vipEndDate: Timestamp,           // VIP結束日期

  // 儲值資訊（獨立）
  balance: number,                 // 當前餘額
  totalDeposit: number,            // 累計儲值
  depositCount: number,            // 儲值次數
  lastDepositDate: Timestamp,      // 最後儲值日期
  lowBalanceThreshold: number,     // 餘額預警值

  // 年度統計
  currentYearStats: {
    year: number,
    visitCount: number,            // 來店次數（VIP判定依據）
    totalSpent: number,
    depositUsed: number
  }
}
```

### deposit_records (儲值記錄)
```javascript
{
  customerId: string,
  customerName: string,
  customerPhone: string,

  // 金額
  depositAmount: number,           // 實付金額
  bonusAmount: number,             // 贈送金額
  totalAmount: number,             // 總儲值額

  // 餘額變化
  previousBalance: number,
  newBalance: number,

  // 付款資訊
  paymentMethod: 'cash' | 'card',
  receiptNumber: string,           // 收據編號（重要！）
  operator: string,
  notes: string,

  // 簽名驗證
  signatureRequired: boolean,
  signatureVerified: boolean,
  signatureDate: Timestamp,

  depositDate: Timestamp,
  createdAt: Timestamp
}
```

### balance_usage_records (儲值使用記錄)
```javascript
{
  customerId: string,
  customerName: string,
  visitId: string,
  serviceName: string,
  amount: number,
  previousBalance: number,
  newBalance: number,
  usageDate: Timestamp
}
```

---

## API 功能

### 會員管理
- `getMembershipInfo(level)` - 取得會員等級資訊
- `getMembershipStats()` - 取得會員統計（一般/VIP/有儲值/總餘額）
- `checkAndUpdateVIPEligibility(customerId)` - 檢查VIP資格
- `approveVIP(customerId, approved, operator)` - 審核VIP
- `getVIPEligibleCustomers()` - 取得待審核VIP名單

### 儲值管理
- `addDeposit(customerId, amount, bonusAmount, paymentMethod, operator, notes)` - 充值
- `getDepositRecords(customerId)` - 取得充值記錄
- `getDepositByReceiptNumber(receiptNumber)` - 依收據編號查詢（比對實體卡）
- `verifyDepositSignature(depositRecordId)` - 驗證簽名
- `recordBalanceUsage(customerId, visitId, serviceName, amount)` - 記錄使用
- `getBalanceUsageRecords(customerId)` - 取得使用記錄
- `checkLowBalance(customer)` - 檢查餘額預警

---

## 管理員操作指南

### 客戶儲值
1. 進入「客戶管理」
2. 選擇客戶，點擊「儲值」
3. 輸入充值金額和贈送金額
4. 選擇付款方式（現金/刷卡）
5. 系統生成收據編號
6. 打印實體儲值卡（包含收據編號）
7. 客戶簽名確認
8. 在系統中標記「簽名已驗證」

### VIP審核
1. 進入「客戶管理」
2. 篩選「符合VIP資格」
3. 查看客戶年度來店次數
4. 點擊「審核VIP」
5. 確認通過或拒絕
6. 系統自動設定VIP有效期

### 比對實體卡
1. 客戶出示實體儲值卡
2. 輸入卡上的收據編號
3. 系統顯示該筆儲值詳情
4. 核對金額、日期、簽名
5. 確認無誤

---

## 常見問題

### Q: 為什麼取消儲值會員等級？
A: 簡化會員制度，讓客戶更容易理解。儲值是資金管理功能，不應與會員等級混淆。

### Q: VIP會員使用儲值付款，享受折扣嗎？
A: 是的！VIP會員無論使用何種付款方式，都享有5折優惠。

### Q: 儲值記錄如何與實體卡比對？
A: 每筆儲值都有唯一的收據編號，打印在實體卡上，可隨時透過系統查詢驗證。

### Q: VIP資格會自動延期嗎？
A: 不會。VIP有效期為一年，到期後需重新累積來店次數。

### Q: 客戶可以同時擁有多張儲值卡嗎？
A: 建議一個客戶一張卡，所有儲值記錄都綁定在客戶帳號下。

---

## 遷移指南

### 現有客戶處理
1. **原儲值會員** → 轉為**一般會員** + 保留儲值餘額
2. **原VIP會員** → 保持**VIP會員** + 檢查有效期
3. 所有儲值記錄保留不變

### 系統升級步驟
1. 備份資料庫
2. 更新 customerService.js
3. 更新 UI 組件（Dashboard, CustomerManagement）
4. 部署新版本
5. 通知客戶會員制度變更

---

**更新日期**: 2025年1月
**版本**: 2.0
