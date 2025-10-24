// 療程管理服務
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
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';

const COLLECTION_NAME = 'services';

// 取得所有療程
export const getAllServices = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('取得療程列表失敗:', error);
    throw error;
  }
};

// 取得單一療程
export const getServiceById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('取得療程資料失敗:', error);
    throw error;
  }
};

// 上傳圖片到 Firebase Storage
export const uploadServiceImage = async (file, serviceId) => {
  try {
    const timestamp = Date.now();
    const storageRef = ref(storage, `services/${serviceId}_${timestamp}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('上傳圖片失敗:', error);
    throw error;
  }
};

// 刪除圖片
export const deleteServiceImage = async (imageUrl) => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('刪除圖片失敗:', error);
    // 不拋出錯誤，因為圖片可能已經被刪除
  }
};

// 新增療程
export const createService = async (serviceData, imageFile = null) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      name: serviceData.name || '',
      description: serviceData.description || '',
      price: parseInt(serviceData.price) || 0,
      selfOilPrice: serviceData.selfOilPrice ? parseInt(serviceData.selfOilPrice) : null,
      duration: parseInt(serviceData.duration) || 60,
      order: parseInt(serviceData.order) || 0,
      imageUrl: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // 如果有圖片，上傳並更新
    if (imageFile) {
      const imageUrl = await uploadServiceImage(imageFile, docRef.id);
      await updateDoc(docRef, { imageUrl });
    }

    return docRef.id;
  } catch (error) {
    console.error('新增療程失敗:', error);
    throw error;
  }
};

// 更新療程
export const updateService = async (id, serviceData, imageFile = null) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);

    // 如果有新圖片，先刪除舊圖片
    if (imageFile && serviceData.imageUrl) {
      await deleteServiceImage(serviceData.imageUrl);
    }

    // 上傳新圖片
    let imageUrl = serviceData.imageUrl;
    if (imageFile) {
      imageUrl = await uploadServiceImage(imageFile, id);
    }

    await updateDoc(docRef, {
      name: serviceData.name || '',
      description: serviceData.description || '',
      price: parseInt(serviceData.price) || 0,
      selfOilPrice: serviceData.selfOilPrice ? parseInt(serviceData.selfOilPrice) : null,
      duration: parseInt(serviceData.duration) || 60,
      order: parseInt(serviceData.order) || 0,
      imageUrl,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('更新療程失敗:', error);
    throw error;
  }
};

// 刪除療程
export const deleteService = async (id) => {
  try {
    const service = await getServiceById(id);

    // 刪除圖片
    if (service?.imageUrl) {
      await deleteServiceImage(service.imageUrl);
    }

    // 刪除文件
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('刪除療程失敗:', error);
    throw error;
  }
};
