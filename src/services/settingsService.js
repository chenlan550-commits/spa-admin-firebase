// 系統設定服務
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const SETTINGS_DOC = 'settings';
const COLLECTION_NAME = 'system';

// 取得系統設定
export const getSettings = async () => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    }

    // 如果不存在，返回預設設定
    return getDefaultSettings();
  } catch (error) {
    console.error('取得系統設定失敗:', error);
    throw error;
  }
};

// 取得預設設定
const getDefaultSettings = () => ({
  businessHours: {
    monday: { open: '10:00', close: '20:00', isOpen: true },
    tuesday: { open: '10:00', close: '20:00', isOpen: true },
    wednesday: { open: '10:00', close: '20:00', isOpen: true },
    thursday: { open: '10:00', close: '20:00', isOpen: true },
    friday: { open: '10:00', close: '20:00', isOpen: true },
    saturday: { open: '10:00', close: '18:00', isOpen: true },
    sunday: { open: '10:00', close: '18:00', isOpen: false }
  },
  contactInfo: {
    phone: '',
    email: '',
    address: '',
    lineId: '',
    facebook: '',
    instagram: ''
  },
  bookingSettings: {
    advanceBookingDays: 30,
    minBookingHours: 2,
    slotDuration: 60,
    bufferTime: 15
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    bookingConfirmation: true,
    bookingReminder: true,
    reminderHoursBefore: 24
  }
});

// 更新系統設定
export const updateSettings = async (settingsData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        ...settingsData,
        updatedAt: Timestamp.now()
      });
    } else {
      await setDoc(docRef, {
        ...settingsData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('更新系統設定失敗:', error);
    throw error;
  }
};

// 初始化系統設定
export const initializeSettings = async () => {
  try {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const defaultSettings = getDefaultSettings();
      await setDoc(docRef, {
        ...defaultSettings,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return defaultSettings;
    }

    return docSnap.data();
  } catch (error) {
    console.error('初始化系統設定失敗:', error);
    throw error;
  }
};
