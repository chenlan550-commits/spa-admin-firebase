// 電子報訂閱服務 - 後台管理
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_NAME = 'newsletter_subscribers';

/**
 * 取得所有訂閱者
 * @returns {Promise<Array>} 訂閱者列表
 */
export const getAllSubscribers = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('subscribedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('獲取訂閱者列表失敗:', error);
    throw error;
  }
};

/**
 * 依語言篩選訂閱者
 * @param {string} language - 語言
 * @returns {Promise<Array>} 訂閱者列表
 */
export const getSubscribersByLanguage = async (language) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('language', '==', language),
      orderBy('subscribedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('依語言獲取訂閱者失敗:', error);
    throw error;
  }
};

/**
 * 取得訂閱者統計
 * @returns {Promise<Object>} 統計資料
 */
export const getSubscriberStats = async () => {
  try {
    const subscribers = await getAllSubscribers();

    const stats = {
      total: subscribers.length,
      byLanguage: {
        zh: subscribers.filter(s => s.language === 'zh').length,
        en: subscribers.filter(s => s.language === 'en').length,
        ja: subscribers.filter(s => s.language === 'ja').length
      },
      active: subscribers.filter(s => s.status === 'active').length,
      unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length
    };

    return stats;
  } catch (error) {
    console.error('獲取訂閱者統計失敗:', error);
    throw error;
  }
};

/**
 * 刪除訂閱者
 * @param {string} subscriberId - 訂閱者 ID
 * @returns {Promise<void>}
 */
export const deleteSubscriber = async (subscriberId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, subscriberId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除訂閱者失敗:', error);
    throw error;
  }
};

/**
 * 批次刪除訂閱者
 * @param {Array<string>} subscriberIds - 訂閱者 ID 陣列
 * @returns {Promise<void>}
 */
export const batchDeleteSubscribers = async (subscriberIds) => {
  try {
    const deletePromises = subscriberIds.map(id => deleteSubscriber(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('批次刪除訂閱者失敗:', error);
    throw error;
  }
};

/**
 * 匯出訂閱者為 CSV
 * @param {Array} subscribers - 訂閱者列表
 * @returns {string} CSV 字串
 */
export const exportSubscribersToCSV = (subscribers) => {
  try {
    const headers = ['Email', '語言', '狀態', '訂閱日期', '來源'];
    const rows = subscribers.map(sub => [
      sub.email,
      sub.language === 'zh' ? '中文' : sub.language === 'en' ? 'English' : '日本語',
      sub.status === 'active' ? '已訂閱' : '已取消',
      sub.subscribedAt?.toDate?.()?.toLocaleString('zh-TW') || '-',
      sub.source || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  } catch (error) {
    console.error('匯出 CSV 失敗:', error);
    throw error;
  }
};

/**
 * 下載 CSV 檔案
 * @param {string} csvContent - CSV 內容
 * @param {string} filename - 檔案名稱
 */
export const downloadCSV = (csvContent, filename = 'newsletter_subscribers.csv') => {
  try {
    // 加入 BOM 以支援中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下載 CSV 失敗:', error);
    throw error;
  }
};

export default {
  getAllSubscribers,
  getSubscribersByLanguage,
  getSubscriberStats,
  deleteSubscriber,
  batchDeleteSubscribers,
  exportSubscribersToCSV,
  downloadCSV
};
