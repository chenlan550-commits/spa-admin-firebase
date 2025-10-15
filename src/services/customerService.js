// 客戶管理服務
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
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      membershipLevel: customerData.membershipLevel || 'regular', // 會員等級：regular, deposit_20k, deposit_30k, deposit_50k, vip
      balance: customerData.balance || 0, // 儲值餘額
      totalDeposit: customerData.totalDeposit || 0, // 累計儲值金額
      totalSpent: customerData.totalSpent || 0, // 累計消費金額
      visitCount: customerData.visitCount || 0, // 消費次數
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
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

// 會員儲值
export const depositBalance = async (customerId, amount, depositType) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('客戶不存在');
    }

    const currentData = customerDoc.data();
    const newBalance = (currentData.balance || 0) + amount;
    const newTotalDeposit = (currentData.totalDeposit || 0) + amount;

    // 根據儲值類型設定會員等級
    let newMembershipLevel = currentData.membershipLevel || 'regular';
    if (depositType === '20k') {
      newMembershipLevel = 'deposit_20k';
    } else if (depositType === '30k') {
      newMembershipLevel = 'deposit_30k';
    } else if (depositType === '50k') {
      newMembershipLevel = 'deposit_50k';
    }

    await updateDoc(customerRef, {
      balance: newBalance,
      totalDeposit: newTotalDeposit,
      membershipLevel: newMembershipLevel,
      updatedAt: Timestamp.now()
    });

    return { balance: newBalance, membershipLevel: newMembershipLevel };
  } catch (error) {
    console.error('儲值失敗:', error);
    throw error;
  }
};

// 會員消費（扣除餘額）
export const consumeBalance = async (customerId, amount) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    const customerDoc = await getDoc(customerRef);

    if (!customerDoc.exists()) {
      throw new Error('客戶不存在');
    }

    const currentData = customerDoc.data();
    const currentBalance = currentData.balance || 0;

    if (currentBalance < amount) {
      throw new Error('餘額不足');
    }

    const newBalance = currentBalance - amount;
    const newTotalSpent = (currentData.totalSpent || 0) + amount;
    const newVisitCount = (currentData.visitCount || 0) + 1;

    await updateDoc(customerRef, {
      balance: newBalance,
      totalSpent: newTotalSpent,
      visitCount: newVisitCount,
      updatedAt: Timestamp.now()
    });

    return { balance: newBalance };
  } catch (error) {
    console.error('消費扣款失敗:', error);
    throw error;
  }
};

// 升級為VIP
export const upgradeToVIP = async (customerId) => {
  try {
    const customerRef = doc(db, COLLECTION_NAME, customerId);
    await updateDoc(customerRef, {
      membershipLevel: 'vip',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('升級VIP失敗:', error);
    throw error;
  }
};

// 取得會員等級資訊
export const getMembershipInfo = (level) => {
  const levels = {
    regular: { label: '普通會員', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    deposit_20k: { label: '儲值會員 2萬', color: 'text-blue-600', bgColor: 'bg-blue-100' },
    deposit_30k: { label: '儲值會員 3萬', color: 'text-purple-600', bgColor: 'bg-purple-100' },
    deposit_50k: { label: '儲值會員 5萬', color: 'text-amber-600', bgColor: 'bg-amber-100' },
    vip: { label: 'VIP會員', color: 'text-rose-600', bgColor: 'bg-rose-100' }
  };
  return levels[level] || levels.regular;
};

// 取得各會員等級統計
export const getMembershipStats = async () => {
  try {
    const customers = await getAllCustomers();
    const stats = {
      regular: 0,
      deposit_20k: 0,
      deposit_30k: 0,
      deposit_50k: 0,
      vip: 0,
      total: customers.length
    };

    customers.forEach(customer => {
      const level = customer.membershipLevel || 'regular';
      if (stats.hasOwnProperty(level)) {
        stats[level]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('取得會員統計失敗:', error);
    throw error;
  }
};
