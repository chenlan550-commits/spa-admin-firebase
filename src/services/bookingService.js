// 預約管理服務
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
import { createOrUpdateCustomerFromBooking } from './customerService';

// 使用 'appointments' 集合名稱，與前端網站統一
const COLLECTION_NAME = 'appointments';

// 取得所有預約
export const getAllBookings = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // 兼容前端和後台的數據結構
      return {
        id: doc.id,
        ...data,
        // 如果有 date 欄位，轉換為 bookingDate
        bookingDate: data.bookingDate || data.date,
        // 如果有 time 欄位，轉換為 bookingTime
        bookingTime: data.bookingTime || data.time,
        // 如果有 name 欄位，轉換為 customerName
        customerName: data.customerName || data.name,
      };
    });
  } catch (error) {
    console.error('取得預約列表失敗:', error);
    throw error;
  }
};

// 取得特定日期範圍的預約
export const getBookingsByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('bookingDate', '>=', Timestamp.fromDate(startDate)),
      where('bookingDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('bookingDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('取得預約列表失敗:', error);
    throw error;
  }
};

// 取得單一預約
export const getBookingById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('取得預約資料失敗:', error);
    throw error;
  }
};

// 新增預約（自動建立或更新客戶）
export const createBooking = async (bookingData) => {
  try {
    // 先建立預約
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      customerName: bookingData.customerName || '',
      phone: bookingData.phone || '',
      email: bookingData.email || '',
      customerId: bookingData.customerId || '',
      membershipLevel: bookingData.membershipLevel || 'regular',
      bookingDate: bookingData.bookingDate,
      bookingTime: bookingData.bookingTime || '',
      serviceId: bookingData.serviceId || '',
      serviceName: bookingData.serviceName || '',
      price: parseInt(bookingData.price) || 0,
      originalPrice: parseInt(bookingData.originalPrice) || 0,
      useSelfOil: bookingData.useSelfOil || false,
      selfOilPrice: parseInt(bookingData.selfOilPrice) || 0,
      extraOilFee: parseInt(bookingData.extraOilFee) || 0,
      additionalServiceId: bookingData.additionalServiceId || '',
      additionalService: bookingData.additionalService || '',
      additionalServicePrice: parseInt(bookingData.additionalServicePrice) || 0,
      totalPrice: parseInt(bookingData.totalPrice) || parseInt(bookingData.price) || 0,
      status: bookingData.status || 'pending',
      paymentStatus: bookingData.paymentStatus || 'unpaid',
      notes: bookingData.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    const bookingId = docRef.id;

    // 自動建立或更新客戶資料
    if (bookingData.phone && bookingData.customerName) {
      try {
        const result = await createOrUpdateCustomerFromBooking({
          ...bookingData,
          id: bookingId
        });

        // 更新預約，關聯客戶ID
        await updateDoc(docRef, {
          customerId: result.customerId,
          updatedAt: Timestamp.now()
        });

        console.log(result.isNew ? '已自動建立新客戶' : '已更新現有客戶預約記錄');
      } catch (customerError) {
        console.error('自動建立/更新客戶失敗:', customerError);
        // 即使客戶建立失敗，預約仍然保存
      }
    }

    return bookingId;
  } catch (error) {
    console.error('新增預約失敗:', error);
    throw error;
  }
};

// 更新預約
export const updateBooking = async (id, bookingData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      updatedAt: Timestamp.now()
    };

    // 只更新提供的欄位
    if (bookingData.customerName !== undefined) updateData.customerName = bookingData.customerName;
    if (bookingData.phone !== undefined) updateData.phone = bookingData.phone;
    if (bookingData.email !== undefined) updateData.email = bookingData.email;
    if (bookingData.customerId !== undefined) updateData.customerId = bookingData.customerId;
    if (bookingData.membershipLevel !== undefined) updateData.membershipLevel = bookingData.membershipLevel;
    if (bookingData.bookingDate !== undefined) updateData.bookingDate = bookingData.bookingDate;
    if (bookingData.bookingTime !== undefined) updateData.bookingTime = bookingData.bookingTime;
    if (bookingData.serviceId !== undefined) updateData.serviceId = bookingData.serviceId;
    if (bookingData.serviceName !== undefined) updateData.serviceName = bookingData.serviceName;
    if (bookingData.price !== undefined) updateData.price = parseInt(bookingData.price) || 0;
    if (bookingData.originalPrice !== undefined) updateData.originalPrice = parseInt(bookingData.originalPrice) || 0;
    if (bookingData.useSelfOil !== undefined) updateData.useSelfOil = bookingData.useSelfOil;
    if (bookingData.selfOilPrice !== undefined) updateData.selfOilPrice = parseInt(bookingData.selfOilPrice) || 0;
    if (bookingData.extraOilFee !== undefined) updateData.extraOilFee = parseInt(bookingData.extraOilFee) || 0;
    if (bookingData.additionalServiceId !== undefined) updateData.additionalServiceId = bookingData.additionalServiceId;
    if (bookingData.additionalService !== undefined) updateData.additionalService = bookingData.additionalService;
    if (bookingData.additionalServicePrice !== undefined) updateData.additionalServicePrice = parseInt(bookingData.additionalServicePrice) || 0;
    if (bookingData.totalPrice !== undefined) updateData.totalPrice = parseInt(bookingData.totalPrice) || 0;
    if (bookingData.status !== undefined) updateData.status = bookingData.status;
    if (bookingData.paymentStatus !== undefined) updateData.paymentStatus = bookingData.paymentStatus;
    if (bookingData.notes !== undefined) updateData.notes = bookingData.notes;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('更新預約失敗:', error);
    throw error;
  }
};

// 刪除預約
export const deleteBooking = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('刪除預約失敗:', error);
    throw error;
  }
};

// 取得今日預約
export const getTodayBookings = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await getBookingsByDateRange(today, tomorrow);
  } catch (error) {
    console.error('取得今日預約失敗:', error);
    throw error;
  }
};

// 取得本月預約
export const getMonthBookings = async (year, month) => {
  try {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return await getBookingsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('取得本月預約失敗:', error);
    throw error;
  }
};

// 更新預約狀態
export const updateBookingStatus = async (id, status) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('更新預約狀態失敗:', error);
    throw error;
  }
};

// 取得預約統計
export const getBookingStats = async () => {
  try {
    const bookings = await getAllBookings();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const stats = {
      total: bookings.length,
      today: 0,
      thisMonth: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    bookings.forEach(booking => {
      const bookingDate = booking.bookingDate?.toDate?.() || new Date(0);

      // 今日統計
      if (bookingDate >= today && bookingDate < tomorrow) {
        stats.today++;
      }

      // 本月統計
      if (bookingDate >= thisMonth && bookingDate < nextMonth) {
        stats.thisMonth++;
      }

      // 狀態統計
      const status = booking.status || 'pending';
      if (stats.hasOwnProperty(status)) {
        stats[status]++;
      }
    });

    return stats;
  } catch (error) {
    console.error('取得預約統計失敗:', error);
    throw error;
  }
};
