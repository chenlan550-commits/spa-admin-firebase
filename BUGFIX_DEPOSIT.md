# 儲值功能問題修復

## 問題描述

### 錯誤訊息
```
FirebaseError: Missing or insufficient permissions.
```

### 問題原因
Firestore 安全規則中缺少 `deposit_records` 和 `balance_usage_records` 兩個 collection 的訪問權限配置。

---

## 修復內容

### 1. 更新 Firestore Rules

在 `firestore.rules` 中添加：

```javascript
// 儲值記錄 - 只有登入用戶可以訪問
match /deposit_records/{document} {
  allow read, write: if request.auth != null;
}

// 餘額使用記錄 - 只有登入用戶可以訪問
match /balance_usage_records/{document} {
  allow read, write: if request.auth != null;
}
```

### 2. 權限說明

- **deposit_records**: 儲值記錄
  - 包含每筆儲值的詳細資訊
  - 收據編號、金額、贈送、付款方式等

- **balance_usage_records**: 餘額使用記錄
  - 記錄使用儲值餘額的消費
  - 追蹤餘額變化

兩個 collection 都設定為：
- ✅ 已登入用戶可以讀取和寫入
- ❌ 未登入用戶無法訪問

---

## 修復步驟

1. ✅ 修改 `firestore.rules`
2. ✅ 部署更新的規則: `firebase deploy --only firestore:rules`
3. ✅ 驗證部署成功

---

## 驗證方法

### 測試儲值功能

1. 登入後台管理系統
2. 進入「客戶管理」
3. 點擊任一客戶的「儲值」按鈕
4. 調整儲值金額和贈送金額
5. 點擊「確認儲值」
6. ✅ 應該顯示「儲值成功」

### 檢查資料庫

在 Firebase Console 中：
1. 進入 Firestore Database
2. 應該可以看到新的 `deposit_records` collection
3. 儲值記錄包含：
   - depositAmount（實付金額）
   - bonusAmount（贈送金額）
   - totalAmount（總額）
   - receiptNumber（收據編號）
   - 客戶資訊
   - 時間戳記

---

## 完整的 Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 療程服務 - 前端可讀取，只有登入用戶可以修改
    match /services/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 內容管理 - 前端可讀取，只有登入用戶可以修改
    match /content/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 設定 - 前端可讀取，只有登入用戶可以修改
    match /settings/{document} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // 預約 - 任何人可以創建預約，只有登入用戶可以查看和管理
    match /appointments/{document} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // 客戶資料 - 只有登入用戶可以訪問
    match /customers/{document} {
      allow read, write: if request.auth != null;
    }

    // 來店記錄 - 只有登入用戶可以訪問
    match /visits/{document} {
      allow read, write: if request.auth != null;
    }

    // 電子報訂閱 - 任何人可以訂閱，只有登入用戶可以查看和管理
    match /newsletter_subscribers/{document} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // 聯絡訊息 - 任何人可以發送，只有登入用戶可以查看和管理
    match /contact_messages/{document} {
      allow create: if true;
      allow read, update, delete: if request.auth != null;
    }

    // 儲值記錄 - 只有登入用戶可以訪問 ✨ 新增
    match /deposit_records/{document} {
      allow read, write: if request.auth != null;
    }

    // 餘額使用記錄 - 只有登入用戶可以訪問 ✨ 新增
    match /balance_usage_records/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 其他相關修復

### 添加錯誤日誌

在 `CustomerManagement.jsx` 的 `handleDeposit` 函數中添加了詳細的錯誤日誌：

```javascript
try {
  console.log('開始儲值:', {
    customerId: selectedCustomer.id,
    depositAmount,
    bonusAmount,
    paymentMethod
  });

  const result = await addDeposit(...);

  console.log('儲值成功:', result);
  // ...
} catch (error) {
  console.error('儲值失敗詳細錯誤:', error);
  // ...
}
```

這些日誌有助於：
- 快速定位問題
- 了解儲值流程
- 除錯時查看參數

---

## 部署資訊

- **修復日期**: 2025年1月
- **版本**: v2.1.1
- **部署狀態**: ✅ 完成
- **影響範圍**: Firestore Rules
- **部署命令**: `firebase deploy --only firestore:rules`

---

## 測試結果

### 預期行為

✅ **儲值成功流程**:
1. 點擊「儲值」按鈕 → 開啟對話框
2. 調整金額 → 即時顯示總額
3. 點擊「確認儲值」 → 顯示成功訊息
4. 資料庫新增記錄 → deposit_records
5. 客戶餘額更新 → customers.balance
6. 對話框關閉 → 返回客戶列表

✅ **資料完整性**:
- 收據編號自動生成
- 實付金額和贈送金額分別記錄
- 總額正確計算
- 時間戳記正確
- 客戶資訊完整

---

## 預防措施

為避免類似問題，在添加新 collection 時：

1. ✅ 同步更新 `firestore.rules`
2. ✅ 同步更新 `firestore.indexes.json`（如需要）
3. ✅ 部署規則和索引
4. ✅ 測試權限是否正確

### Checklist 範本

```markdown
新增 Collection: ____________

- [ ] 添加到 firestore.rules
- [ ] 設定適當權限（read/write/create/update/delete）
- [ ] 添加必要的索引到 firestore.indexes.json
- [ ] 部署規則: firebase deploy --only firestore:rules
- [ ] 部署索引: firebase deploy --only firestore:indexes
- [ ] 測試寫入權限
- [ ] 測試讀取權限
- [ ] 更新文檔
```

---

## 相關文檔

- [Firestore 安全規則文檔](https://firebase.google.com/docs/firestore/security/get-started)
- [儲值介面更新說明](./DEPOSIT_UI_UPDATE.md)
- [會員制度說明](./MEMBERSHIP_SYSTEM.md)

---

**問題已解決！** ✅

儲值功能現在可以正常運作了。
