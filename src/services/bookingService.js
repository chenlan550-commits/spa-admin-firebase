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

// 新增預約
export const createBooking = async (bookingData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...bookingData,
      status: bookingData.status || 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('新增預約失敗:', error);
    throw error;
  }
};

// 更新預約
export const updateBooking = async (id, bookingData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...bookingData,
      updatedAt: Timestamp.now()
    });
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
