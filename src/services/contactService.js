// 聯絡訊息服務 - 後台管理
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION_NAME = 'contact_messages';

/**
 * 取得所有聯絡訊息
 * @returns {Promise<Array>} 訊息列表
 */
export const getAllMessages = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('獲取訊息列表失敗:', error);
    throw error;
  }
};

/**
 * 取得單一訊息
 * @param {string} messageId - 訊息 ID
 * @returns {Promise<Object>} 訊息資料
 */
export const getMessage = async (messageId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error('訊息不存在');
    }
  } catch (error) {
    console.error('獲取訊息失敗:', error);
    throw error;
  }
};

/**
 * 依狀態篩選訊息
 * @param {string} status - 狀態 (unread, read, replied)
 * @returns {Promise<Array>} 訊息列表
 */
export const getMessagesByStatus = async (status) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('依狀態獲取訊息失敗:', error);
    throw error;
  }
};

/**
 * 取得未讀訊息
 * @returns {Promise<Array>} 未讀訊息列表
 */
export const getUnreadMessages = async () => {
  return getMessagesByStatus('unread');
};

/**
 * 更新訊息狀態
 * @param {string} messageId - 訊息 ID
 * @param {string} status - 新狀態
 * @returns {Promise<void>}
 */
export const updateMessageStatus = async (messageId, status) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    await updateDoc(docRef, {
      status: status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('更新訊息狀態失敗:', error);
    throw error;
  }
};

/**
 * 標記為已讀
 * @param {string} messageId - 訊息 ID
 * @returns {Promise<void>}
 */
export const markAsRead = async (messageId) => {
  return updateMessageStatus(messageId, 'read');
};

/**
 * 標記為已回覆
 * @param {string} messageId - 訊息 ID
 * @returns {Promise<void>}
 */
export const markAsReplied = async (messageId) => {
  return updateMessageStatus(messageId, 'replied');
};

/**
 * 刪除訊息
 * @param {string} messageId - 訊息 ID
 * @returns {Promise<void>}
 */
export const deleteMessage = async (messageId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, messageId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('刪除訊息失敗:', error);
    throw error;
  }
};

/**
 * 批次刪除訊息
 * @param {Array<string>} messageIds - 訊息 ID 陣列
 * @returns {Promise<void>}
 */
export const batchDeleteMessages = async (messageIds) => {
  try {
    const deletePromises = messageIds.map(id => deleteMessage(id));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('批次刪除訊息失敗:', error);
    throw error;
  }
};

/**
 * 取得訊息統計
 * @returns {Promise<Object>} 統計資料
 */
export const getMessageStats = async () => {
  try {
    const messages = await getAllMessages();

    const stats = {
      total: messages.length,
      unread: messages.filter(m => m.status === 'unread').length,
      read: messages.filter(m => m.status === 'read').length,
      replied: messages.filter(m => m.status === 'replied').length,
      byLanguage: {
        zh: messages.filter(m => m.language === 'zh').length,
        en: messages.filter(m => m.language === 'en').length,
        ja: messages.filter(m => m.language === 'ja').length
      },
      byService: {}
    };

    // 統計各服務類型的訊息數量
    messages.forEach(msg => {
      const service = msg.service || '其他';
      stats.byService[service] = (stats.byService[service] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('獲取訊息統計失敗:', error);
    throw error;
  }
};

/**
 * 匯出訊息為 CSV
 * @param {Array} messages - 訊息列表
 * @returns {string} CSV 字串
 */
export const exportMessagesToCSV = (messages) => {
  try {
    const headers = ['姓名', '電話', 'Email', '感興趣的服務', '訊息內容', '狀態', '語言', '建立時間'];
    const rows = messages.map(msg => [
      msg.name || '-',
      msg.phone || '-',
      msg.email || '-',
      msg.service || '-',
      msg.message || '-',
      msg.status === 'unread' ? '未讀' : msg.status === 'read' ? '已讀' : '已回覆',
      msg.language === 'zh' ? '中文' : msg.language === 'en' ? 'English' : '日本語',
      msg.createdAt?.toDate?.()?.toLocaleString('zh-TW') || '-'
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
export const downloadCSV = (csvContent, filename = 'contact_messages.csv') => {
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
  getAllMessages,
  getMessage,
  getMessagesByStatus,
  getUnreadMessages,
  updateMessageStatus,
  markAsRead,
  markAsReplied,
  deleteMessage,
  batchDeleteMessages,
  getMessageStats,
  exportMessagesToCSV,
  downloadCSV
};
