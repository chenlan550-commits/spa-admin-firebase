// 內容管理服務
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

const COLLECTION_NAME = 'content';

// 取得所有內容
export const getAllContent = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('取得內容列表失敗:', error);
    throw error;
  }
};

// 取得特定類型的內容
export const getContentByType = async (type) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('type', '==', type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('取得內容失敗:', error);
    throw error;
  }
};

// 取得單一內容
export const getContentById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('取得內容資料失敗:', error);
    throw error;
  }
};

// 新增內容
export const createContent = async (contentData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...contentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('新增內容失敗:', error);
    throw error;
  }
};

// 更新內容
export const updateContent = async (id, contentData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...contentData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('更新內容失敗:', error);
    throw error;
  }
};

// 刪除內容
export const deleteContent = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('刪除內容失敗:', error);
    throw error;
  }
};
