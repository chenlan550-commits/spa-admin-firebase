# 來店記錄 - 精油選項功能

## 功能摘要

新增了來店記錄的精油選項功能，支援：
1. **一般客戶**：可勾選「自備精油」使用優惠價格（selfOilPrice）
2. **VIP客戶**：預設含精油的VIP折扣價，可選擇忘記帶精油的額外費用（以100為單位）

## 修改的檔案

### 1. `src/components/VisitManagement.jsx`

#### 新增狀態欄位
```javascript
useSelfOil: false,      // 一般客戶：自備精油
extraOilFee: 0,         // VIP客戶：額外精油費用
```

#### 新增處理函數
- `handleSelfOilChange(checked)` - 處理一般客戶勾選自備精油
- `handleExtraOilFeeChange(fee)` - 處理VIP客戶額外精油費用

#### 價格計算邏輯
**一般客戶：**
- 未勾選自備精油：使用原價 (`service.price`)
- 勾選自備精油：使用優惠價 (`service.selfOilPrice`)

**VIP客戶：**
- 基礎價格：原價 × 0.5（VIP折扣）
- 最終價格：基礎價格 + 額外精油費用

#### UI 組件
**一般客戶（非VIP且已選擇療程）：**
```jsx
<input type="checkbox" id="useSelfOil" />
<Label>自備精油（使用優惠價格）</Label>
```

**VIP客戶（VIP且已選擇療程）：**
```jsx
<Select>
  <SelectItem value="0">無需額外付費</SelectItem>
  <SelectItem value="100">+ NT$ 100</SelectItem>
  <SelectItem value="200">+ NT$ 200</SelectItem>
  ...
</Select>
```

#### 表格顯示
- 自備精油：綠色徽章「自備精油」
- 額外費用：橙色徽章「+NT$ {amount}」

### 2. `src/services/visitService.js`

#### visitRecord 新增欄位
```javascript
useSelfOil: visitData.useSelfOil || false,
extraOilFee: visitData.extraOilFee || 0,
```

## 使用流程

### 一般客戶來店記錄
1. 選擇客戶（非VIP）
2. 選擇療程
3. 勾選「自備精油」→ 價格自動更新為 selfOilPrice
4. 填寫其他資訊並提交

### VIP客戶來店記錄
1. 選擇VIP客戶
2. 選擇療程 → 自動套用VIP折扣（50% off）
3. 如果忘記帶精油，選擇額外費用 → 價格自動加上額外費用
4. 填寫其他資訊並提交

## 測試項目

- [x] 一般客戶勾選自備精油，價格正確顯示 selfOilPrice
- [x] VIP客戶選擇額外精油費用，價格正確計算
- [x] 切換客戶時精油選項正確重置
- [x] 表格中正確顯示精油標記
- [x] 資料正確儲存到 Firebase
- [x] 編輯模式正確顯示精油選項（禁用狀態）

## 注意事項

1. **編輯模式顯示**：
   - 編輯已存在的來店記錄時，精油選項會顯示為「禁用」狀態
   - 可以看到原始記錄的精油選項（勾選狀態或額外費用）
   - 顯示提示訊息：「編輯模式下無法修改精油選項」
   - 無法修改精油選項（保持原始價格）

2. **療程需求**：需要在 Firebase services 集合中設定 `selfOilPrice` 欄位

3. **VIP判斷**：系統會自動判斷客戶是否為VIP並顯示對應的精油選項

4. **價格優先級**：
   - 一般客戶：selfOilPrice > originalPrice
   - VIP客戶：(originalPrice × 0.5) + extraOilFee

## 前台整合參考

前台預約系統已經在 https://luxury-spa-website.pages.dev/booking 實作了類似功能，
後台來店記錄系統現在與前台保持一致的邏輯。
