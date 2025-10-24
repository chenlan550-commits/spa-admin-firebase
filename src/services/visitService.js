// 來店記錄服務 - 完整版
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCustomerById, updateCustomer, addVisitToCustomer, recordBalanceUsage } from './customerService';

const COLLECTION_NAME = 'visits';

// 取得所有來店記錄
export const getAllVisits = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 前端排序（最新的在前）
    return visits.sort((a, b) => {
      const dateA = a.visitDate?.toDate?.() || new Date(0);
      const dateB = b.visitDate?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('取得來店記錄失敗:', error);
    throw error;
  }
};

// 取得特定客戶的來店記錄
export const getVisitsByCustomerId = async (customerId) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('customerId', '==', customerId)
    );
    const querySnapshot = await getDocs(q);
    const visits = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 前端排序
    return visits.sort((a, b) => {
      const dateA = a.visitDate?.toDate?.() || new Date(0);
      const dateB = b.visitDate?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error('取得客戶來店記錄失敗:', error);
    throw error;
  }
};

// 取得單一來店記錄
export const getVisitById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('取得來店記錄失敗:', error);
    throw error;
  }
};

// 新增來店記錄（包含客戶記錄追蹤）
export const createVisit = async (visitData) => {
  try {
    const visitDate = visitData.visitDate || Timestamp.now();

    // 直接使用前端傳來的價格，不重新計算
    const originalPrice = visitData.originalPrice || visitData.price || 0;
    const finalPrice = visitData.price || visitData.originalPrice || 0;

    // 計算折扣比例（用於記錄）
    let discount = originalPrice > 0 ? finalPrice / originalPrice : 1.0;
    let membershipType = 'regular';

    // 獲取客戶資料
    if (visitData.customerId) {
      const customer = await getCustomerById(visitData.customerId);
      if (!customer) {
        throw new Error('找不到客戶資料');
      }

      membershipType = customer.membershipLevel || 'regular';

      // 如果使用儲值扣款，檢查餘額並扣款
      if (visitData.paymentMethod === 'deposit') {
        const currentBalance = customer.balance || 0;

        if (currentBalance < finalPrice) {
          throw new Error(`儲值餘額不足。目前餘額：NT$ ${currentBalance}，需要：NT$ ${finalPrice}`);
        }

        // 扣除餘額
        const newBalance = currentBalance - finalPrice;
        await updateCustomer(visitData.customerId, {
          balance: newBalance
        });
      }
    }

    // 建立來店記錄
    const visitRecord = {
      customerId: visitData.customerId,
      customerName: visitData.customerName,
      serviceId: visitData.serviceId,
      serviceName: visitData.serviceName,
      visitDate: visitDate,
      duration: visitData.duration || 60,

      // 價格計算
      originalPrice: originalPrice,
      membershipType: membershipType,
      discount: discount,
      finalPrice: finalPrice,

      // 精油選項
      useSelfOil: visitData.useSelfOil || false, // 一般客戶：自備精油
      extraOilFee: visitData.extraOilFee || 0, // VIP客戶：忘記帶精油額外費用

      paymentMethod: visitData.paymentMethod || 'cash', // cash, card, deposit
      paymentStatus: visitData.paymentStatus || 'unpaid', // paid, unpaid
      notes: visitData.notes || '',
      bookingId: visitData.bookingId || null, // 關聯預約ID

      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), visitRecord);
    const visitId = docRef.id;

    // 添加消費記錄到客戶（保留一年）
    if (visitData.customerId) {
      await addVisitToCustomer(visitData.customerId, {
        visitId: visitId,
        serviceName: visitData.serviceName,
        visitDate: visitDate,
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        paymentMethod: visitData.paymentMethod || 'cash',
        discount: discount,
        createdAt: Timestamp.now()
      });

      // 如果使用儲值付款，記錄餘額使用明細
      if (visitData.paymentMethod === 'deposit') {
        await recordBalanceUsage(
          visitData.customerId,
          visitId,
          visitData.serviceName,
          finalPrice
        );
      }
    }

    return visitId;
  } catch (error) {
    console.error('新增來店記錄失敗:', error);
    throw error;
  }
};

// 更新來店記錄
export const updateVisit = async (id, visitData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    // 如果更改了付款方式或金額，需要處理儲值餘額
    if (visitData.paymentMethod || visitData.price !== undefined) {
      const oldVisit = await getVisitById(id);

      // 如果原本是儲值，需要退回餘額
      if (oldVisit.paymentMethod === 'deposit' && oldVisit.customerId) {
        const customer = await getCustomerById(oldVisit.customerId);
        if (customer) {
          const refundAmount = oldVisit.price || 0;
          await updateCustomer(oldVisit.customerId, {
            balance: (customer.balance || 0) + refundAmount
          });
        }
      }

      // 如果新的是儲值，需要扣除餘額
      if (visitData.paymentMethod === 'deposit' && oldVisit.customerId) {
        const customer = await getCustomerById(oldVisit.customerId);
        if (!customer) {
          throw new Error('找不到客戶資料');
        }

        const price = visitData.price !== undefined ? visitData.price : oldVisit.price;
        if ((customer.balance || 0) < price) {
          throw new Error('儲值餘額不足');
        }

        await updateCustomer(oldVisit.customerId, {
          balance: (customer.balance || 0) - price
        });
      }
    }

    await updateDoc(docRef, {
      ...visitData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('更新來店記錄失敗:', error);
    throw error;
  }
};

// 刪除來店記錄
export const deleteVisit = async (id) => {
  try {
    // 如果是儲值付款，需要退回餘額
    const visit = await getVisitById(id);
    if (visit && visit.paymentMethod === 'deposit' && visit.customerId) {
      const customer = await getCustomerById(visit.customerId);
      if (customer) {
        const refundAmount = visit.price || 0;
        await updateCustomer(visit.customerId, {
          balance: (customer.balance || 0) + refundAmount
        });
      }
    }

    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('刪除來店記錄失敗:', error);
    throw error;
  }
};

// 從預約建立來店記錄（從 BookingManagement 調用）
export const createVisitFromBooking = async (bookingId) => {
  try {
    // 獲取預約資料
    const { getBookingById } = await import('./bookingService');
    const booking = await getBookingById(bookingId);

    if (!booking) {
      throw new Error('找不到預約資料');
    }

    // 檢查是否已付款
    if (booking.paymentStatus !== 'paid') {
      throw new Error('只有已付款的預約才能建立來店記錄');
    }

    const visitData = {
      customerId: booking.customerId || '',
      customerName: booking.customerName || '',
      serviceId: booking.serviceId || '',
      serviceName: booking.serviceName || '',
      visitDate: booking.bookingDate || Timestamp.now(),
      duration: booking.duration || 60,
      originalPrice: booking.originalPrice || booking.price || 0,
      price: booking.totalPrice || booking.price || 0,
      useSelfOil: booking.useSelfOil || false,
      extraOilFee: booking.extraOilFee || 0,
      paymentMethod: booking.paymentMethod || 'cash',
      paymentStatus: 'paid', // 從已付款預約建立，直接標記為已付款
      notes: booking.notes || '',
      bookingId: bookingId // 關聯到原始預約
    };

    return await createVisit(visitData);
  } catch (error) {
    console.error('從預約建立來店記錄失敗:', error);
    throw error;
  }
};

// 取得客戶來店統計
export const getCustomerVisitStats = async (customerId) => {
  try {
    const visits = await getVisitsByCustomerId(customerId);

    const stats = {
      totalVisits: visits.length,
      totalSpent: visits.reduce((sum, visit) => sum + (visit.finalPrice || visit.price || 0), 0),
      lastVisit: visits.length > 0 ? visits[0].visitDate : null,
      favoriteService: null
    };

    // 計算最常消費的療程
    if (visits.length > 0) {
      const serviceCounts = {};
      visits.forEach(visit => {
        if (visit.serviceName) {
          serviceCounts[visit.serviceName] = (serviceCounts[visit.serviceName] || 0) + 1;
        }
      });

      const maxCount = Math.max(...Object.values(serviceCounts));
      stats.favoriteService = Object.keys(serviceCounts).find(
        service => serviceCounts[service] === maxCount
      );
    }

    return stats;
  } catch (error) {
    console.error('取得客戶來店統計失敗:', error);
    throw error;
  }
};

// 取得來店記錄統計
export const getVisitStats = async () => {
  try {
    const visits = await getAllVisits();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const stats = {
      total: visits.length,
      today: 0,
      thisMonth: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      thisMonthRevenue: 0,
      paymentMethods: {
        cash: 0,
        card: 0,
        deposit: 0
      }
    };

    visits.forEach(visit => {
      const visitDate = visit.visitDate?.toDate?.() || new Date(0);
      const price = visit.finalPrice || visit.price || 0;

      stats.totalRevenue += price;

      // 今日統計
      if (visitDate >= today && visitDate < tomorrow) {
        stats.today++;
        stats.todayRevenue += price;
      }

      // 本月統計
      if (visitDate >= thisMonth && visitDate < nextMonth) {
        stats.thisMonth++;
        stats.thisMonthRevenue += price;
      }

      // 付款方式統計
      const paymentMethod = visit.paymentMethod || 'cash';
      if (stats.paymentMethods.hasOwnProperty(paymentMethod)) {
        stats.paymentMethods[paymentMethod] += price;
      }
    });

    return stats;
  } catch (error) {
    console.error('取得來店記錄統計失敗:', error);
    throw error;
  }
};

// 搜尋來店記錄
export const searchVisits = async (searchTerm) => {
  try {
    const allVisits = await getAllVisits();
    const term = searchTerm.toLowerCase();

    return allVisits.filter(visit =>
      visit.customerName?.toLowerCase().includes(term) ||
      visit.serviceName?.toLowerCase().includes(term) ||
      visit.notes?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('搜尋來店記錄失敗:', error);
    throw error;
  }
};

// 取得日期範圍內的來店記錄
export const getVisitsByDateRange = async (startDate, endDate) => {
  try {
    const allVisits = await getAllVisits();
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return allVisits.filter(visit => {
      const visitDate = visit.visitDate?.toDate?.() || new Date(0);
      return visitDate >= start && visitDate <= end;
    });
  } catch (error) {
    console.error('取得日期範圍來店記錄失敗:', error);
    throw error;
  }
};
