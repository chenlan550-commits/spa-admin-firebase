# 會員制度更新摘要

## 更新日期
2025年1月

## 更新版本
v2.0 - 會員制度簡化版

---

## 主要變更

### 🎯 會員制度簡化

#### 之前（v1.0）
- 一般會員（無折扣）
- 2萬儲值會員（9折）
- 3萬儲值會員（8折）
- 5萬儲值會員（7折）
- VIP會員（5折）

#### 現在（v2.0）
- **一般會員**（無折扣，原價消費）
- **VIP會員**（所有療程享5折優惠）

### ✨ 儲值系統獨立化

#### 重大改變
- ✅ 儲值功能與會員等級**完全分離**
- ✅ 所有會員都可以儲值
- ✅ 儲值不影響會員等級
- ✅ VIP會員使用儲值付款仍享5折優惠

#### 新增功能
- ✅ 每筆儲值產生唯一收據編號
- ✅ 收據編號用於與實體儲值卡比對
- ✅ 支援客戶簽名驗證功能
- ✅ 可依收據編號查詢儲值記錄

### 🏆 VIP資格調整

#### 之前
- 年度消費滿12萬元自動符合VIP資格

#### 現在
- **年度來店滿40次**自動符合VIP資格
- 需管理員審核通過
- VIP有效期為一年

---

## 技術變更

### 資料庫更新

#### customers collection
```javascript
{
  // 會員等級（只有兩種）
  membershipLevel: 'regular' | 'vip',  // 移除: deposit_20k, deposit_30k, deposit_50k

  // VIP資格（改為來店次數判定）
  vipEligible: boolean,
  vipEligibleDate: Timestamp,

  // 儲值資訊（獨立）
  balance: number,
  totalDeposit: number,
  depositCount: number,
  lastDepositDate: Timestamp,

  // 年度統計
  currentYearStats: {
    year: number,
    visitCount: number,       // 用於VIP資格判定
    totalSpent: number,
    depositUsed: number
  }
}
```

#### deposit_records collection（增強）
```javascript
{
  // 金額資訊
  depositAmount: number,      // 實付金額
  bonusAmount: number,        // 贈送金額
  totalAmount: number,        // 總額

  // 收據編號（新增）
  receiptNumber: string,      // 用於比對實體卡

  // 簽名驗證（新增）
  signatureRequired: boolean,
  signatureVerified: boolean,
  signatureDate: Timestamp,

  // 其他
  paymentMethod: 'cash' | 'card',
  operator: string,
  notes: string
}
```

### API變更

#### 移除的函數
- ~~`upgradeToVIP()`~~ → 改為 `approveVIP()`
- ~~`depositBalance(customerId, amount, depositType)`~~ → 改為 `addDeposit(customerId, amount, bonusAmount, ...)`
- ~~`DEPOSIT_LEVELS`~~ → 不再需要預定義的儲值等級

#### 新增的函數
- `checkAndUpdateVIPEligibility(customerId)` - 檢查VIP資格（基於來店次數）
- `approveVIP(customerId, approved, operator)` - 審核VIP申請
- `getVIPEligibleCustomers()` - 取得待審核VIP名單
- `getDepositByReceiptNumber(receiptNumber)` - 依收據編號查詢
- `verifyDepositSignature(depositRecordId)` - 驗證簽名

#### 更新的函數
- `getMembershipInfo(level)` - 只返回 regular 或 vip
- `getMembershipStats()` - 新增 `withDeposit` 和 `totalBalance` 統計
- `addDeposit()` - 支援任意金額儲值和簽名功能

### UI組件更新

#### Dashboard.jsx
- 會員統計卡片從5個減少到4個
  - 一般會員
  - VIP會員
  - 有儲值客戶（新增）
  - 總儲值餘額（新增）

#### CustomerManagement.jsx
- 更新導入：`upgradeToVIP` → `approveVIP`
- 更新VIP審核流程
- 支援查看儲值記錄和收據編號

---

## 遷移指南

### 現有客戶資料處理

#### 方案A：自動遷移（建議）
```javascript
// 將所有儲值會員轉為一般會員，保留儲值餘額
customers.forEach(customer => {
  if (['deposit_20k', 'deposit_30k', 'deposit_50k'].includes(customer.membershipLevel)) {
    updateCustomer(customer.id, {
      membershipLevel: 'regular',
      // balance 保留不變
      // totalDeposit 保留不變
    });
  }
});
```

#### 方案B：手動審核
1. 匯出所有儲值會員名單
2. 逐一檢視年度來店次數
3. 符合40次以上的，審核升級為VIP
4. 其餘降為一般會員

### 儲值記錄處理
- 所有現有儲值記錄保持不變
- 新儲值記錄會自動產生收據編號
- 舊記錄可選擇性補充收據編號

---

## 部署檢查清單

### 部署前
- [x] 備份資料庫
- [x] 更新 customerService.js
- [x] 更新 Dashboard.jsx
- [x] 更新 CustomerManagement.jsx
- [x] 更新文檔（README, FEATURES, MEMBERSHIP_SYSTEM）
- [x] 測試構建
- [x] 檢查所有導入

### 部署中
- [x] `npm run build`
- [x] `firebase deploy`
- [x] 驗證部署成功

### 部署後
- [ ] 測試會員功能
- [ ] 測試儲值功能
- [ ] 測試VIP審核流程
- [ ] 測試收據編號查詢
- [ ] 驗證統計數據正確
- [ ] 通知客戶會員制度變更

---

## 客戶溝通範本

### 公告標題
「會員制度簡化通知」

### 公告內容
```
親愛的顧客您好：

為提供更清晰的會員服務，我們將會員制度進行了簡化：

【新的會員制度】
✨ 一般會員：原價享受所有療程
👑 VIP會員：所有療程享5折優惠

【VIP升級條件】
年度來店滿40次，即可升級VIP會員（有效期一年）

【儲值服務】
✅ 所有會員都可以儲值
✅ 儲值金額可自由選擇
✅ 每筆儲值提供實體卡和收據
✅ VIP會員使用儲值付款仍享5折優惠

【現有會員權益】
- 您的儲值餘額完全保留
- 原VIP會員權益不變
- 原儲值會員轉為一般會員，儲值餘額不受影響

如有任何疑問，請隨時與我們聯繫。

謝謝您的支持！
```

---

## 常見問題

### Q1: 原本的儲值會員怎麼辦？
A: 轉為一般會員，但儲值餘額完全保留，可以繼續使用。

### Q2: VIP會員資格如何取得？
A: 年度來店滿40次，系統自動標記符合資格，經管理員審核通過後升級為VIP。

### Q3: VIP會員有效期多久？
A: 一年。到期後需重新累積來店次數。

### Q4: 儲值還有贈送嗎？
A: 有的！儲值時管理員可以自訂贈送金額。

### Q5: 實體儲值卡如何驗證？
A: 每張卡都有收據編號，可透過系統查詢該筆儲值的完整資訊。

---

## 優勢總結

### 對客戶
- ✅ 制度更簡單，容易理解
- ✅ VIP門檻更明確（來店40次）
- ✅ 儲值更靈活，不綁定等級
- ✅ VIP優惠更優惠（5折）

### 對店家
- ✅ 管理更簡單
- ✅ 減少會員等級混淆
- ✅ 實體卡驗證機制更完善
- ✅ VIP資格審核更透明
- ✅ 鼓勵客戶頻繁來店

---

## 後續優化建議

### 短期（1個月內）
- [ ] 開發實體儲值卡打印功能
- [ ] 建立VIP到期提醒機制
- [ ] 客戶儲值餘額不足提醒

### 中期（3個月內）
- [ ] 統計VIP轉換率
- [ ] 分析儲值使用情況
- [ ] 優化儲值贈送方案

### 長期（6個月內）
- [ ] 考慮季度VIP方案
- [ ] 推出儲值回饋活動
- [ ] 開發會員APP

---

## 聯絡資訊

如有技術問題或建議，請聯絡系統管理員。

**版本**: v2.0
**更新日期**: 2025年1月
**部署狀態**: ✅ 已完成
**部署URL**: https://spa-admin-firebase.web.app
