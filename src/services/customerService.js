// 客戶管理服務 - 簡化會員制度版本
// 只保留：一般會員、VIP會員
// 儲值功能獨立，不再與會員等級綁定

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_NAME = 'customers';

// ==================== 會員等級配置 ====================

/**
 * 會員等級：只有兩種
 * - regular: 一般會員
 * - vip: VIP會員
 */
export const MEMBERSHIP_LEVELS = {
  regular: {
    value: 'regular',
    label: '一般會員',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  vip: {
    value: 'vip',
    label: 'VIP會員',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100'
  }
};

// VIP 資格條件（年度來店40次）
export const VIP_REQUIREMENT = {
  annualVisits: 40,
  description: '年度來店滿 40 次自動符合 VIP 資格'
};

// 取得會員等級資訊
export const getMembershipInfo = (level) => {
  return MEMBERSHIP_LEVELS[level] || MEMBERSHIP_LEVELS.regular;
};

// 取得各會員等級統計
export const getMembershipStats = async () => {
  try {
    const customers = await getAllCustomers();
    const stats = {
      regular: 0,
      vip: 0,
      total: customers.length,
      withDeposit: 0,  // 有儲值的客戶數
      totalBalance: 0  // 所有客戶的總儲值餘額
    };

    customers.forEach(customer => {
      const level = customer.membershipLevel || 'regular';
      if (level === 'vip') {
        stats.vip++;
      } else {
        stats.regular++;
      }

      const balance = customer.balance || 0;
      if (balance > 0) {
        stats.withDeposit++;
      }
      stats.totalBalance += balance;
    });

    return stats;
  } catch (error) {
    console.error('取得會員統計失敗:', error);
    throw error;
  }
};

// ==================== 基本客戶管理 ====================

// 取得所有客戶
export const getAllCustomers = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('取得客戶列表失敗:', error);
    throw error;
  }
};

// 取得單一客戶
export const getCustomerById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('取得客戶資料失敗:', error);
    throw error;
  }
};

// 新增客戶
export const createCustomer = async (customerData) => {
  try {
    const now = Timestamp.now();
    const currentYear = new Date().getFullYear();

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      // 基本資料
      name: customerData.name || '',
      phone: customerData.phone || '',
      email: customerData.email || '',
      gender: customerData.gender || '',
      birthday: customerData.birthday || null,
      address: customerData.address || '',
      notes: customerData.notes || '',

      // 會員資訊（只有 regular 或 vip）
      membershipLevel: customerData.membershipLevel || 'regular',

      // VIP 資格管理
      vipEligible: false,           // 是否符合VIP資格（年度來店40次）
      vipEligibleDate: null,         // 符合資格的日期
      vipApproved: false,            // 管理員是否已審核通過
      vipApprovedBy: null,           // 審核人員
      vipApprovedDate: null,         // 審核日期
      vipStartDate: null,            // VIP開始日期
      vipEndDate: null,              // VIP結束日期（一年後）

      // 儲值資訊（獨立於會員等級）
      balance: customerData.balance || 0,              // 當前餘額
      totalDeposit: customerData.totalDeposit || 0,    // 累計儲值總額
      depositCount: 0,                                 // 儲值次數
      lastDepositDate: null,                           // 最後儲值日期
      lowBalanceThreshold: 1000,                       // 餘額預警閾值

      // 年度統計（用於VIP資格判定）
      currentYearStats: {
        year: currentYear,
        visitCount: 0,       // 年度來店次數
        totalSpent: 0,       // 年度消費總額
        depositUsed: 0       // 年度使用儲值金額
      },

      // 總體統計
      totalVisits: 0,                    // 總來店次數
      totalSpent: 0,                     // 總消費金額
      firstVisitDate: null,              // 首次來店日期
      lastVisitDate: null,               // 最後來店日期

      // 最近記錄（保留一年）
      recentAppointments: [],
      recentVisits: [],

      // 系統欄位
      createdFrom: customerData.createdFrom || 'manual',
      createdAt: now,
      updatedAt: now
    });
    return docRef.id;
  } catch (error) {
    console.error('新增客戶失敗:', error);
    throw error;
  }
};

// 更新客戶
export const updateCustomer = async (id, customerData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...customerData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('更新客戶失敗:', error);
    throw error;
  }
};

// 刪除客戶
export const deleteCustomer = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('刪除客戶失敗:', error);
    throw error;
  }
};

// 搜尋客戶
export const searchCustomers = async (searchTerm) => {
  try {
    const customers = await getAllCustomers();
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error('搜尋客戶失敗:', error);
    throw error;
  }
};

// ==================== 儲值管理（獨立功能）====================

/**
 * 儲值充值 - 不再綁定會員等級
 * @param {string} customerId - 客戶 ID
 * @param {number} amount - 充值金額
 * @param {number} bonusAmount - 贈送金額（可選）
 * @param {string} paymentMethod - 付款方式 (cash/card)
 * @param {string} operator - 操作人員
 * @param {string} notes - 備註
 */
export const addDeposit = async (customerId, amount, bonusAmount = 0, paymentMethod = 'cash', operator = '系統', notes = '') => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('找不到客戶');
    }

    const previousBalance = customer.balance || 0;
    const totalAmount = amount + bonusAmount;
    const newBalance = previousBalance + totalAmount;

    // 生成收據編號（用於與實體卡比對）
    const receiptNumber = `DEP${Date.now().toString().slice(-8)}`;

    // 創建充值記錄
    const depositRecord = {
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      depositAmount: amount,           // 實際支付金額
      bonusAmount: bonusAmount,         // 贈送金額
      totalAmount: totalAmount,         // 總儲值金額
      paymentMethod,
      previousBalance,
      newBalance,
      operator,
      receiptNumber,                    // 收據編號（用於比對實體卡）
      notes,
      depositDate: Timestamp.now(),
      createdAt: Timestamp.now(),

      // 簽名確認（預留欄位）
      signatureRequired: true,          // 是否需要簽名
      signatureVerified: false,         // 簽名是否已驗證
      signatureDate: null               // 簽名日期
    };

    // 儲存充值記錄到資料庫
    const depositRecordRef = await addDoc(collection(db, 'deposit_records'), depositRecord);

    // 更新客戶餘額
    await updateCustomer(customerId, {
      balance: newBalance,
      totalDeposit: (customer.totalDeposit || 0) + totalAmount,
      lastDepositDate: Timestamp.now(),
      depositCount: (customer.depositCount || 0) + 1
    });

    return {
      success: true,
      depositRecordId: depositRecordRef.id,
      depositRecord,
      receiptNumber,
      message: bonusAmount > 0
        ? `充值成功！充值 NT$ ${amount.toLocaleString()}，贈送 NT$ ${bonusAmount.toLocaleString()}，共 NT$ ${totalAmount.toLocaleString()}`
        : `充值成功！充值 NT$ ${amount.toLocaleString()}`
    };
  } catch (error) {
    console.error('儲值充值失敗:', error);
    throw error;
  }
};

/**
 * 驗證儲值記錄簽名
 * @param {string} depositRecordId - 充值記錄 ID
 */
export const verifyDepositSignature = async (depositRecordId) => {
  try {
    const depositRecordRef = doc(db, 'deposit_records', depositRecordId);
    await updateDoc(depositRecordRef, {
      signatureVerified: true,
      signatureDate: Timestamp.now()
    });
    return { success: true, message: '簽名驗證成功' };
  } catch (error) {
    console.error('簽名驗證失敗:', error);
    throw error;
  }
};

/**
 * 取得充值記錄
 * @param {string} customerId - 客戶 ID（可選）
 */
export const getDepositRecords = async (customerId = null) => {
  try {
    let q;
    if (customerId) {
      q = query(
        collection(db, 'deposit_records'),
        where('customerId', '==', customerId),
        orderBy('depositDate', 'desc')
      );
    } else {
      q = query(
        collection(db, 'deposit_records'),
        orderBy('depositDate', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('取得充值記錄失敗:', error);
    return [];
  }
};

/**
 * 依收據編號查詢充值記錄（用於比對實體卡）
 * @param {string} receiptNumber - 收據編號
 */
export const getDepositByReceiptNumber = async (receiptNumber) => {
  try {
    const q = query(
      collection(db, 'deposit_records'),
      where('receiptNumber', '==', receiptNumber)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('查詢充值記錄失敗:', error);
    throw error;
  }
};

/**
 * 記錄餘額使用（儲值消費）
 * @param {string} customerId - 客戶 ID
 * @param {string} visitId - 來店記錄 ID
 * @param {string} serviceName - 療程名稱
 * @param {number} amount - 消費金額
 */
export const recordBalanceUsage = async (customerId, visitId, serviceName, amount) => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('找不到客戶');
    }

    const previousBalance = customer.balance || 0;
    if (previousBalance < amount) {
      throw new Error(`餘額不足！目前餘額 NT$ ${previousBalance.toLocaleString()}，需要 NT$ ${amount.toLocaleString()}`);
    }

    const newBalance = previousBalance - amount;

    // 記錄使用記錄
    await addDoc(collection(db, 'balance_usage_records'), {
      customerId,
      customerName: customer.name,
      visitId,
      serviceName,
      amount,
      previousBalance,
      newBalance,
      usageDate: Timestamp.now(),
      createdAt: Timestamp.now()
    });

    // 更新客戶餘額
    await updateCustomer(customerId, {
      balance: newBalance
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('記錄餘額使用失敗:', error);
    throw error;
  }
};

/**
 * 取得餘額使用記錄
 * @param {string} customerId - 客戶 ID
 */
export const getBalanceUsageRecords = async (customerId) => {
  try {
    const q = query(
      collection(db, 'balance_usage_records'),
      where('customerId', '==', customerId),
      orderBy('usageDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('取得餘額使用記錄失敗:', error);
    return [];
  }
};

/**
 * 檢查餘額預警
 */
export const checkLowBalance = (customer) => {
  const balance = customer.balance || 0;
  const threshold = customer.lowBalanceThreshold || 1000;

  return {
    isLow: balance < threshold && balance > 0,
    balance,
    threshold,
    message: balance < threshold && balance > 0
      ? `餘額不足！目前餘額 NT$ ${balance.toLocaleString()}，建議充值`
      : null
  };
};

// ==================== VIP 會員管理 ====================

/**
 * 檢查並更新VIP資格（年度來店40次）
 * @param {string} customerId - 客戶 ID
 */
export const checkAndUpdateVIPEligibility = async (customerId) => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('找不到客戶');
    }

    // 如果已經是VIP或已符合資格，不重複檢查
    if (customer.membershipLevel === 'vip' || customer.vipEligible) {
      return { eligible: customer.vipEligible, alreadyVIP: customer.membershipLevel === 'vip' };
    }

    const currentYear = new Date().getFullYear();
    const yearStats = customer.currentYearStats || { year: currentYear, visitCount: 0 };

    // 檢查年度來店次數是否達標
    if (yearStats.visitCount >= VIP_REQUIREMENT.annualVisits) {
      await updateCustomer(customerId, {
        vipEligible: true,
        vipEligibleDate: Timestamp.now()
      });

      return {
        eligible: true,
        message: `恭喜！客戶 ${customer.name} 年度來店已達 ${yearStats.visitCount} 次，符合VIP資格，請管理員審核。`
      };
    }

    return { eligible: false, visitCount: yearStats.visitCount, required: VIP_REQUIREMENT.annualVisits };
  } catch (error) {
    console.error('檢查VIP資格失敗:', error);
    throw error;
  }
};

/**
 * 購買VIP會員（付費20,000元）
 * @param {string} customerId - 客戶 ID
 * @param {string} paymentMethod - 付款方式 (cash/card/deposit)
 * @param {string} operator - 操作人員
 */
export const purchaseVIP = async (customerId, paymentMethod = 'cash', operator = '系統管理員') => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('找不到客戶');
    }

    // 檢查是否已經是VIP
    if (customer.membershipLevel === 'vip') {
      const vipEndDate = customer.vipEndDate?.toDate?.() || new Date(customer.vipEndDate);
      if (vipEndDate > new Date()) {
        throw new Error('客戶已經是VIP會員，有效期至 ' + vipEndDate.toLocaleDateString());
      }
    }

    const VIP_PRICE = 20000;
    const now = Timestamp.now();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    // 如果使用儲值付款，檢查餘額並扣款
    if (paymentMethod === 'deposit') {
      const currentBalance = customer.balance || 0;
      if (currentBalance < VIP_PRICE) {
        throw new Error(`儲值餘額不足。目前餘額：NT$ ${currentBalance.toLocaleString()}，需要：NT$ ${VIP_PRICE.toLocaleString()}`);
      }

      // 扣除餘額
      await updateCustomer(customerId, {
        balance: currentBalance - VIP_PRICE
      });

      // 記錄餘額使用
      await recordBalanceUsage(customerId, null, 'VIP會員購買', VIP_PRICE);
    }

    // 創建VIP購買記錄（作為來店記錄）
    const visitData = {
      customerId,
      customerName: customer.name,
      serviceId: 'VIP',
      serviceName: 'VIP會員購買',
      visitDate: now,
      duration: 0,
      originalPrice: VIP_PRICE,
      membershipType: customer.membershipLevel || 'regular',
      discount: 1.0,
      finalPrice: VIP_PRICE,
      paymentMethod,
      notes: `購買VIP會員一年，有效期至 ${oneYearLater.toLocaleDateString()}`,
      createdAt: now,
      updatedAt: now
    };

    // 保存到 visits collection
    await addDoc(collection(db, 'visits'), visitData);

    // 更新客戶為VIP
    await updateCustomer(customerId, {
      membershipLevel: 'vip',
      vipPurchased: true,
      vipStartDate: now,
      vipEndDate: Timestamp.fromDate(oneYearLater),
      totalSpent: (customer.totalSpent || 0) + VIP_PRICE
    });

    // 更新年度統計
    const currentYear = new Date().getFullYear();
    let currentYearStats = customer.currentYearStats || { year: currentYear, visitCount: 0, totalSpent: 0, depositUsed: 0 };

    if (currentYearStats.year !== currentYear) {
      currentYearStats = { year: currentYear, visitCount: 0, totalSpent: 0, depositUsed: 0 };
    }

    currentYearStats.totalSpent += VIP_PRICE;
    if (paymentMethod === 'deposit') {
      currentYearStats.depositUsed += VIP_PRICE;
    }

    await updateCustomer(customerId, {
      currentYearStats
    });

    return {
      success: true,
      message: `購買成功！${customer.name} 已升級為VIP會員，有效期至 ${oneYearLater.toLocaleDateString()}`,
      vipEndDate: oneYearLater
    };
  } catch (error) {
    console.error('購買VIP失敗:', error);
    throw error;
  }
};

/**
 * 審核VIP申請（年度來店40次免費升級）
 * @param {string} customerId - 客戶 ID
 * @param {boolean} approved - 是否通過
 * @param {string} operator - 審核人員
 */
export const approveVIP = async (customerId, approved, operator = '管理員') => {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) {
      throw new Error('找不到客戶');
    }

    if (!customer.vipEligible) {
      throw new Error('客戶尚未符合VIP資格');
    }

    const now = Timestamp.now();
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    if (approved) {
      await updateCustomer(customerId, {
        membershipLevel: 'vip',
        vipApproved: true,
        vipApprovedBy: operator,
        vipApprovedDate: now,
        vipStartDate: now,
        vipEndDate: Timestamp.fromDate(oneYearLater)
      });

      return { success: true, message: `客戶 ${customer.name} 已升級為VIP會員（免費），有效期至 ${oneYearLater.toLocaleDateString()}` };
    } else {
      await updateCustomer(customerId, {
        vipEligible: false,
        vipEligibleDate: null
      });

      return { success: true, message: `已拒絕 ${customer.name} 的VIP申請` };
    }
  } catch (error) {
    console.error('VIP審核失敗:', error);
    throw error;
  }
};

/**
 * 取得符合VIP資格但未審核的客戶
 */
export const getVIPEligibleCustomers = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('vipEligible', '==', true),
      where('vipApproved', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('取得VIP候選名單失敗:', error);
    return [];
  }
};

// ==================== 預約和來店記錄管理 ====================

// 從預約資料自動建立或更新客戶
export const createOrUpdateCustomerFromBooking = async (bookingData) => {
  try {
    const existingCustomer = await checkCustomerExistsByPhone(bookingData.phone || bookingData.customerPhone);

    if (existingCustomer) {
      await addAppointmentToCustomer(existingCustomer.id, {
        appointmentId: bookingData.id || null,
        serviceName: bookingData.serviceName || '',
        bookingDate: bookingData.bookingDate || bookingData.date,
        bookingTime: bookingData.bookingTime || bookingData.time,
        status: bookingData.status || 'pending',
        createdAt: Timestamp.now()
      });

      return { customerId: existingCustomer.id, isNew: false };
    }

    const customerData = {
      name: bookingData.customerName || bookingData.name || '',
      phone: bookingData.customerPhone || bookingData.phone || '',
      email: bookingData.customerEmail || bookingData.email || '',
      gender: bookingData.customerGender || bookingData.gender || '',
      notes: `從預約建立 - 首次預約療程: ${bookingData.serviceName || '未知'}`,
      createdFrom: 'appointment'
    };

    const customerId = await createCustomer(customerData);

    await addAppointmentToCustomer(customerId, {
      appointmentId: bookingData.id || null,
      serviceName: bookingData.serviceName || '',
      bookingDate: bookingData.bookingDate || bookingData.date,
      bookingTime: bookingData.bookingTime || bookingData.time,
      status: bookingData.status || 'pending',
      createdAt: Timestamp.now()
    });

    return { customerId, isNew: true };
  } catch (error) {
    console.error('從預約建立/更新客戶失敗:', error);
    throw error;
  }
};

// 檢查客戶是否已存在（根據電話）
export const checkCustomerExistsByPhone = async (phone) => {
  try {
    const customers = await getAllCustomers();
    return customers.find(customer => customer.phone === phone);
  } catch (error) {
    console.error('檢查客戶失敗:', error);
    throw error;
  }
};

// 添加預約記錄到客戶
export const addAppointmentToCustomer = async (customerId, appointmentData) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('客戶不存在');
    }

    const customerData = customerDoc.data();
    let recentAppointments = customerData.recentAppointments || [];

    recentAppointments.unshift(appointmentData);

    // 只保留一年內的記錄
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    recentAppointments = recentAppointments.filter(apt => {
      const aptDate = apt.createdAt?.toDate?.() || new Date(apt.createdAt);
      return aptDate >= oneYearAgo;
    });

    // 限制最多保留100筆
    if (recentAppointments.length > 100) {
      recentAppointments = recentAppointments.slice(0, 100);
    }

    await updateDoc(customerRef, {
      recentAppointments,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('添加預約記錄失敗:', error);
    throw error;
  }
};

// 添加消費記錄到客戶（並檢查VIP資格）
export const addVisitToCustomer = async (customerId, visitData) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('客戶不存在');
    }

    const customerData = customerDoc.data();
    let recentVisits = customerData.recentVisits || [];

    recentVisits.unshift(visitData);

    // 只保留一年內的記錄
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    recentVisits = recentVisits.filter(visit => {
      const visitDate = visit.visitDate?.toDate?.() || new Date(visit.visitDate);
      return visitDate >= oneYearAgo;
    });

    if (recentVisits.length > 100) {
      recentVisits = recentVisits.slice(0, 100);
    }

    // 更新年度統計
    const currentYear = new Date().getFullYear();
    let currentYearStats = customerData.currentYearStats || { year: currentYear, visitCount: 0, totalSpent: 0, depositUsed: 0 };

    // 重置年度統計（如果是新年）
    if (currentYearStats.year !== currentYear) {
      currentYearStats = {
        year: currentYear,
        visitCount: 0,
        totalSpent: 0,
        depositUsed: 0
      };
    }

    currentYearStats.visitCount += 1;
    currentYearStats.totalSpent += visitData.finalPrice || 0;
    if (visitData.paymentMethod === 'deposit') {
      currentYearStats.depositUsed += visitData.finalPrice || 0;
    }

    // 更新來店日期
    const visitDate = visitData.visitDate || Timestamp.now();
    const firstVisitDate = customerData.firstVisitDate || visitDate;

    await updateDoc(customerRef, {
      recentVisits,
      currentYearStats,
      totalVisits: (customerData.totalVisits || 0) + 1,
      totalSpent: (customerData.totalSpent || 0) + (visitData.finalPrice || 0),
      firstVisitDate,
      lastVisitDate: visitDate,
      updatedAt: Timestamp.now()
    });

    // 檢查VIP資格
    await checkAndUpdateVIPEligibility(customerId);

  } catch (error) {
    console.error('添加消費記錄失敗:', error);
    throw error;
  }
};

// ==================== 統計功能 ====================

/**
 * 取得儲值統計
 */
export const getDepositStats = async () => {
  try {
    const customers = await getAllCustomers();

    let totalBalance = 0;
    let totalDeposit = 0;
    let depositCustomers = 0;
    let lowBalanceCustomers = 0;

    customers.forEach(customer => {
      const balance = customer.balance || 0;
      const deposit = customer.totalDeposit || 0;

      totalBalance += balance;
      totalDeposit += deposit;

      if (deposit > 0) {
        depositCustomers++;
      }

      const lowBalance = checkLowBalance(customer);
      if (lowBalance.isLow) {
        lowBalanceCustomers++;
      }
    });

    return {
      totalBalance,
      totalDeposit,
      depositCustomers,
      lowBalanceCustomers,
      avgBalance: depositCustomers > 0 ? totalBalance / depositCustomers : 0
    };
  } catch (error) {
    console.error('取得儲值統計失敗:', error);
    throw error;
  }
};
